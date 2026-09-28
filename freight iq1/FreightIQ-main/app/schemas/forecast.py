from datetime import date
from typing import Optional
from pydantic import BaseModel, Field

from app.constants import VesselClass


class ForecastRequest(BaseModel):
    origin_country: str
    destination_port: str
    vessel_class: VesselClass
    horizon_days: int = Field(30, ge=1, le=180)


class ForecastPoint(BaseModel):
    forecast_date: date
    predicted_rate_usd_per_tonne: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None


class ForecastResponse(BaseModel):
    origin_country: str
    destination_port: str
    vessel_class: VesselClass
    generated_at: date
    points: list[ForecastPoint]
    model_name: str
    trend: str = Field(..., description="'rising' | 'falling' | 'flat' — quick-read summary")


class ShouldHaveWaitedLabel(BaseModel):
    """Derived/decision feature (section 7). Trains / evaluates the
    asymmetric wait-vs-book recommendation.

    For a booking made on `record_date` at `booked_rate`, did the rate fall
    further within the next N days? If so, waiting would have been better.
    """

    record_date: date
    origin_country: str
    destination_port: str
    vessel_class: VesselClass
    booked_rate: float
    window_days: int
    min_rate_in_window: Optional[float] = None
    should_have_waited: Optional[bool] = None
    potential_savings_usd_per_tonne: Optional[float] = None


# ---- Recommendation-engine outputs (Expected Outputs A-D from the PS) ----

class MarketEntryRecommendation(BaseModel):
    """Expected Output A: WHEN should SAIL secure the charter."""

    origin_country: str
    destination_port: str
    vessel_class: VesselClass
    recommendation: str = Field(..., description="'charter_now' | 'wait' | 'watch'")
    confidence: float = Field(..., ge=0, le=1)
    rationale: str
    suggested_window_start: Optional[date] = None
    suggested_window_end: Optional[date] = None


class VesselOptimizationRecommendation(BaseModel):
    """Expected Output B: which vessel type, given cargo volume + route,
    respecting port constraints at both ends."""

    origin_country: str
    origin_port: Optional[str] = None
    destination_port: str
    cargo_qty_tonnes: float
    recommended_vessel_class: VesselClass
    feasible_classes: list[VesselClass]
    excluded_classes: dict[str, str] = Field(
        default_factory=dict, description="class -> reason excluded (e.g. draft/beam/LOA/berth limit)"
    )
    rationale: str


class IdleDeadheadRecommendation(BaseModel):
    """Expected Output C: idle/deadhead scenario management."""

    vessel_name: Optional[str] = None
    vessel_class: VesselClass
    idle_risk: str = Field(..., description="'low' | 'medium' | 'high'")
    idle_window_start: Optional[date] = None
    idle_window_end: Optional[date] = None
    suggested_action: str
    alternative_routes: list[str] = Field(default_factory=list)


class ChartingStrategyRecommendation(BaseModel):
    """Section 10/11: spot vs short/medium-term multi-voyage contracting."""

    origin_country: str
    destination_port: str
    vessel_class: VesselClass
    planned_shipment_count: int
    planned_period_months: int
    recommendation: str = Field(..., description="'spot' | 'multi_voyage'")
    rationale: str
    estimated_savings_pct: Optional[float] = None


class DashboardQuery(BaseModel):
    """What the logistics manager enters in the dashboard (section 17)."""

    cargo_qty_tonnes: float
    origin_country: str
    destination_port: str
    desired_contract_duration_months: Optional[int] = Field(
        None, description="If set, treated as a multi-voyage planning horizon"
    )
    planned_shipment_count: Optional[int] = 1


class DashboardResponse(BaseModel):
    forecast: ForecastResponse
    vessel_recommendation: VesselOptimizationRecommendation
    market_entry: MarketEntryRecommendation
    charting_strategy: Optional[ChartingStrategyRecommendation] = None
    risk_alerts: list[dict] = Field(default_factory=list)
