"""Pydantic schemas for API request/response validation."""
import datetime as _dt
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: str = ""
    is_admin: bool = False

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    current_password: str = ""
    new_password: str = Field(min_length=6)


class GoogleAuthRequest(BaseModel):
    code: str
    redirect_uri: str = ""


# ── Password Recovery ─────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=6)


class MessageResponse(BaseModel):
    message: str


# ── Admin / OAuth ─────────────────────────────────────────────────────────────

class OAuthConfigOut(BaseModel):
    provider: str
    client_id: str
    redirect_uri: str
    enabled: bool

    model_config = {"from_attributes": True}


class OAuthConfigUpdate(BaseModel):
    provider: str = "google"
    client_id: str = ""
    client_secret: str = ""
    redirect_uri: str = ""
    enabled: bool = False


# ── SMTP Config ───────────────────────────────────────────────────────────────

class SmtpConfigOut(BaseModel):
    host: str
    port: int
    user: str
    from_email: str
    from_name: str
    password_set: bool = False

    model_config = {"from_attributes": True}


class SmtpConfigUpdate(BaseModel):
    host: str = "mail.cabrasky.net"
    port: int = 587
    user: str = ""
    password: str = ""
    from_email: str = ""
    from_name: str = "Gastos App"


# ── Expenses ──────────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    date: _dt.date
    description: str
    amount: float = Field(gt=0)
    purpose: str = ""
    motive: str = ""
    tipo: str = ""
    method: str = ""
    ajeno: bool = False
    invitacion: bool = False
    deudores: str = ""
    personas: str = ""
    ref_cc: str = ""
    deuda_metodo: str = ""
    devuelto: bool = False
    me_corresponde: float = 0.0
    viaje: str = ""
    project_id: str = ""


class ExpenseUpdate(BaseModel):
    date: Optional[_dt.date] = None
    description: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0)
    purpose: Optional[str] = None
    motive: Optional[str] = None
    tipo: Optional[str] = None
    method: Optional[str] = None
    ajeno: Optional[bool] = None
    invitacion: Optional[bool] = None
    deudores: Optional[str] = None
    personas: Optional[str] = None
    ref_cc: Optional[str] = None
    deuda_metodo: Optional[str] = None
    devuelto: Optional[bool] = None
    me_corresponde: Optional[float] = None
    viaje: Optional[str] = None
    project_id: Optional[str] = None


class ExpenseOut(BaseModel):
    id: str
    user_id: str
    date: _dt.date
    description: str
    amount: float
    purpose: str
    motive: str
    tipo: str
    method: str
    ajeno: bool
    invitacion: bool
    deudores: str
    personas: str | None = None
    ref_cc: str | None = None
    deuda_metodo: str
    devuelto: bool
    me_corresponde: float
    viaje: str
    project_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Incomes ───────────────────────────────────────────────────────────────────

class IncomeCreate(BaseModel):
    date: _dt.date
    description: str
    amount: float = Field(gt=0)
    category: str = ""
    notes: str = ""


class IncomeUpdate(BaseModel):
    date: Optional[_dt.date] = None
    description: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0)
    category: Optional[str] = None
    notes: Optional[str] = None


class IncomeOut(BaseModel):
    id: str
    user_id: str
    date: _dt.date
    description: str
    amount: float
    category: str
    notes: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Goals ─────────────────────────────────────────────────────────────────────

class GoalCreate(BaseModel):
    name: str
    target_amount: float = Field(gt=0)
    current_amount: float = 0.0
    deadline: Optional[_dt.date] = None
    category: str = ""
    notes: str = ""


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = Field(default=None, gt=0)
    current_amount: Optional[float] = Field(default=None, ge=0)
    deadline: Optional[_dt.date] = None
    category: Optional[str] = None
    notes: Optional[str] = None


class GoalOut(BaseModel):
    id: str
    user_id: str
    name: str
    target_amount: float
    current_amount: float
    deadline: Optional[_dt.date]
    category: str
    notes: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Subscriptions ─────────────────────────────────────────────────────────────

class SubscriptionCreate(BaseModel):
    name: str
    amount: float = Field(gt=0)
    billing_cycle: str = "monthly"  # weekly, monthly, quarterly, yearly
    next_billing: _dt.date
    category: str = ""
    method: str = ""
    notes: str = ""
    active: bool = True


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0)
    billing_cycle: Optional[str] = None
    next_billing: Optional[_dt.date] = None
    category: Optional[str] = None
    method: Optional[str] = None
    notes: Optional[str] = None
    active: Optional[bool] = None


class SubscriptionOut(BaseModel):
    id: str
    user_id: str
    name: str
    amount: float
    billing_cycle: str
    next_billing: _dt.date
    category: str
    method: str
    notes: str
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Projects ──────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str


class ProjectUpdate(BaseModel):
    name: Optional[str] = None


class CategoryBase(BaseModel):
    kind: str = "expense"
    name: str = ""
    color: str = ""


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class CategoryOut(BaseModel):
    id: str
    kind: str
    name: str
    color: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectOut(BaseModel):
    id: str
    user_id: str
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}
