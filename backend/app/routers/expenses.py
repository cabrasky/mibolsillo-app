"""Expenses CRUD router."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.models import Expense
from app.schemas.schemas import ExpenseCreate, ExpenseUpdate, ExpenseOut
from app.routers.auth import get_user_from_bearer as get_current_user
from app.routers.crud import list_entities, get_entity, create_entity, update_entity, delete_entity
from app.services.recurring import ensure_recurring_expense

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseOut])
async def list_expenses(
    skip: int = 0,
    limit: int = 100,
    month: int | None = None,
    year: int | None = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Lógica de gastos recurrentes: si toca (p. ej. día 2 del mes) y falta la
    # fila, se crea antes de devolver la lista para que la web esté al día.
    await ensure_recurring_expense(db, user.id, bool(getattr(user, "is_admin", False)))
    stmt = select(Expense).where(Expense.user_id == user.id).order_by(Expense.date.desc())
    if month and year:
        stmt = stmt.where(
            func.extract("month", Expense.date) == month,
            func.extract("year", Expense.date) == year,
        )
    elif year:
        stmt = stmt.where(func.extract("year", Expense.date) == year)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{expense_id}", response_model=ExpenseOut)
async def get_expense(expense_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    expense = await get_entity(db, Expense, expense_id, user.id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.post("", response_model=ExpenseOut, status_code=201)
async def create_expense(body: ExpenseCreate, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await create_entity(db, Expense, user.id, body.model_dump())


@router.put("/{expense_id}", response_model=ExpenseOut)
async def update_expense(expense_id: str, body: ExpenseUpdate, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    updated = await update_entity(db, Expense, expense_id, user.id, body.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(expense_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    deleted = await delete_entity(db, Expense, expense_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")


# ── Integración: enviar gasto compartido a Cuentas Claras ──────────
import json as _json
import httpx as _httpx
import os as _os

CC_BASE = _os.environ.get("CC_BASE_URL", "https://cuentas-claras.cabrasky.net")
CC_SECRET = _os.environ.get("CC_MB_SECRET", "")


def _personas_list(raw: str):
    try:
        arr = _json.loads(raw or "[]")
        return [p for p in arr if isinstance(p, dict) and p.get("n")]
    except Exception:
        return []


@router.post("/{expense_id}/send-to-cc")
async def send_to_cc(expense_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Empuja un gasto compartido (personas) a Cuentas Claras como reparto."""
    expense = await get_entity(db, Expense, expense_id, user.id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    personas = _personas_list(expense.personas)
    if not personas:
        raise HTTPException(status_code=400, detail="Este gasto no tiene personas (Debe/Invitado) para enviar a CC")
    amount = float(expense.amount or 0)
    parts = []
    sum_parts = 0.0
    for p in personas:
        m = round(float(p.get("m") or 0), 2)
        role = "deb" if p.get("r") == "deb" else "inv"
        if m <= 0:
            continue
        parts.append({"name": str(p["n"])[:30], "amount": m, "role": role})
        sum_parts += m
    self_part = round(amount - sum_parts, 2)
    if self_part > 0.005:
        parts.append({"name": "", "amount": self_part, "role": "self"})
    if not parts:
        raise HTTPException(status_code=400, detail="Sin importes repartibles")
    name = (getattr(user, "name", "") or "").strip() or (user.email or "").split("@")[0]
    payload = {
        "title": expense.description or "Gasto compartido",
        "date": expense.date.isoformat() if expense.date else None,
        "paidBy": name[:30],
        "parts": parts,
        "refMb": f"mb:{expense.id}",
    }
    headers = {"X-MB-Secret": CC_SECRET, "X-MB-Email": (user.email or "").lower()}
    try:
        async with _httpx.AsyncClient(timeout=40) as client:
            resp = await client.post(f"{CC_BASE}/api/integration/mibolsillo/split", json=payload, headers=headers)
    except Exception:
        raise HTTPException(status_code=502, detail="Cuentas Claras no está disponible ahora (reintenta en unos segundos)")
    if resp.status_code == 403:
        raise HTTPException(status_code=409, detail="Tu email no tiene cuenta en Cuentas Claras — créala en cuentas-claras.cabrasky.net")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Cuentas Claras respondió {resp.status_code}")
    data = resp.json()
    expense.ref_cc = _json.dumps(data, ensure_ascii=False)
    await db.commit()
    await db.refresh(expense)
    return {"ok": True, "url": data.get("receipt", {}).get("url", ""), "session": data.get("session"), "receipt": data.get("receipt")}
