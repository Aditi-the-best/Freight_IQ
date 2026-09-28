from datetime import date
from typing import Optional
from pydantic import BaseModel, Field

from app.constants import RISK_TIERS


class RiskEvent(BaseModel):
    """Event-based record — only added when something actually happens
    (geopolitical disruption, port strike, weather event, canal blockage,
    sanctions, etc.)."""

    event_date: date
    affected_route: Optional[str] = Field(None, description="e.g. 'Australia-Paradip'")
    affected_region: Optional[str] = Field(None, description="e.g. 'Red Sea', 'East Coast India'")
    risk_tier: str = Field(..., description=f"one of {RISK_TIERS}")
    description: str
    expected_duration_days: Optional[int] = None
    source: Optional[str] = None


class RiskEventOut(RiskEvent):
    id: int

    class Config:
        from_attributes = True


class RiskAlert(BaseModel):
    """Output of the risk engine — a warning surfaced to the dashboard."""

    generated_at: date
    route: Optional[str] = None
    port: Optional[str] = None
    risk_tier: str
    headline: str
    detail: str
