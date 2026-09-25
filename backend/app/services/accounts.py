"""Borrado de los datos de un usuario.

Lo usan la baja de la cuenta (`DELETE /auth/me`) y el re-sembrado diario de la
cuenta demo. Si se añade una tabla con `user_id`, hay que borrarla aquí también.
"""
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import (
    ApiKey, Category, Expense, ExpensePhoto, Goal, Income, Project, Subscription,
)

# Tablas con datos del usuario (las fotos van aparte: cuelgan de sus gastos)
USER_TABLES = (Expense, Income, Goal, Subscription, Project, Category, ApiKey)


async def delete_user_data(db: AsyncSession, user_id: str) -> None:
    """Borra todo lo que pertenece al usuario, pero no la fila del usuario."""
    expense_ids = select(Expense.id).where(Expense.user_id == user_id)
    await db.execute(delete(ExpensePhoto).where(ExpensePhoto.expense_id.in_(expense_ids)))
    for model in USER_TABLES:
        await db.execute(delete(model).where(model.user_id == user_id))
