"""Gastos recurrentes por lógica de aplicación (sin CronJob externo).

Regla por defecto: cada mes, el día 2, se registra la inversión mensual de
450 € en S&P500 (propósito "Ahorro/Inversion", tipo "Recurrente", método
"Transferencia"). La fila queda fechada el día 2 del mes en curso.

Cuándo se comprueba (idempotente y a prueba de carreras entre réplicas):
  - al arrancar el backend (main.py, lifespan)
  - en cada GET /api/expenses (expenses.py), para que la web esté al día
    aunque el backend no se haya reiniciado en lo que va de mes

Concurrencia: con 3 réplicas comprobando a la vez, se usa un advisory lock
transaccional de Postgres (pg_advisory_xact_lock): solo una inserta y las
demás, al re-comprobar dentro de su transacción tras esperar el lock, ven la
fila ya creada y no hacen nada. Sin cambios de esquema ni índices mágicos.

Configurable por env (RECURRING_DAY, RECURRING_AMOUNT, RECURRING_PURPOSE,
RECURRING_TIPO, RECURRING_METHOD, RECURRING_DESCRIPTION) con los valores de
la regla como defaults.
"""
import os
import uuid
from datetime import date

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Expense

# Clave del advisory lock (constante arbitraria de la regla)
_LOCK_KEY = 882211001

RECURRING_DAY = int(os.getenv("RECURRING_DAY", "2"))
RECURRING_AMOUNT = float(os.getenv("RECURRING_AMOUNT", "450"))
RECURRING_PURPOSE = os.getenv("RECURRING_PURPOSE", "Ahorro/Inversion")
RECURRING_TIPO = os.getenv("RECURRING_TIPO", "Recurrente")
RECURRING_METHOD = os.getenv("RECURRING_METHOD", "Transferencia")
RECURRING_DESCRIPTION = os.getenv("RECURRING_DESCRIPTION", "Inversion S&P500")


def _due_date(today: date) -> date | None:
    """Fecha que debe tener la fila del mes en curso, o None si aún no toca."""
    if today.day < RECURRING_DAY:
        return None  # este mes todavía no ha llegado el día de la regla
    return today.replace(day=RECURRING_DAY)


async def _locked_insert(db: AsyncSession, user_id: str, target: date) -> bool:
    """Dentro de la transacción actual: lock + comprobar + insertar."""
    await db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": _LOCK_KEY})
    month_start = target.replace(day=1)
    month_end = (
        date(month_start.year + 1, 1, 1)
        if month_start.month == 12
        else date(month_start.year, month_start.month + 1, 1)
    )
    exists = await db.execute(
        text(
            """
            SELECT 1 FROM expenses
            WHERE user_id = :uid AND date >= :ms AND date < :me
              AND purpose = :p AND type = :t AND amount = :a
            """
        ),
        {
            "uid": user_id,
            "ms": month_start,
            "me": month_end,
            "p": RECURRING_PURPOSE,
            "t": RECURRING_TIPO,
            "a": RECURRING_AMOUNT,
        },
    )
    if exists.first():
        return False

    expense = Expense(
        id=str(uuid.uuid4()),
        user_id=user_id,
        date=target,
        description=RECURRING_DESCRIPTION,
        amount=RECURRING_AMOUNT,
        purpose=RECURRING_PURPOSE,
        motive="",
        type=RECURRING_TIPO,
        method=RECURRING_METHOD,
        is_shared=False,
        debtors="",
        repayment_method="",
        repaid=False,
        personal_share=RECURRING_AMOUNT,
        trip="",
    )
    db.add(expense)
    await db.flush()
    print(
        f"[recurring] OK: {target.isoformat()} — {RECURRING_DESCRIPTION} "
        f"{RECURRING_AMOUNT:g} € ({RECURRING_PURPOSE} / {RECURRING_TIPO} / {RECURRING_METHOD})"
    )
    return True


async def ensure_recurring_expense(db: AsyncSession, user_id: str, is_admin: bool = False) -> bool:
    if not is_admin:
        return False  # la regla global (S&P500 día 2) es del dueño; por-usuario vendrá con tabla propia
    """Crea la fila recurrente del mes en curso si toca y aún no existe."""
    target = _due_date(date.today())
    if target is None:
        return False
    if db.in_transaction():
        # Ya hay transacción abierta: la reutilizamos (el lock se libera al cerrarla).
        return await _locked_insert(db, user_id, target)
    async with db.begin():
        return await _locked_insert(db, user_id, target)

