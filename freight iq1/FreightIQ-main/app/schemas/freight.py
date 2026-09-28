from datetime import date
from typing import Optional
from pydantic import BaseModel, Field

from app.constants import VesselClass


class BalticIndexRecord(BaseModel):
    """Daily Baltic Dry Index + sub-indices. This is the core forecasting target."""

    record_date: date
    bdi: float = Field(..., description="Baltic Dry Index (composite)")
    bci: Optional[float] = Field(None, description="Capesize sub-index")
    bpi: Optional[float] = Field(None, description="Panamax sub-index")
    bsi: Optional[float] = Field(None, description="Supramax sub-index")
    bhsi: Optional[float] = Field(None, description="Handysize sub-index")


class FxRateRecord(BaseModel):
    record_date: date
    usd_inr: float


class FreightRateObservation(BaseModel):
    """A concrete freight rate observed/quoted for a route + vessel class.

    This is what forecasting predicts going forward, and what
    should-have-waited labels are computed on retrospectively.
    """

    record_date: date
    origin_country: str
    destination_port: str
    vessel_class: VesselClass
    rate_usd_per_tonne: float
    source: Optional[str] = Field(None, description="e.g. 'FFA', 'broker quote', 'fixture report'")


class FFAQuote(BaseModel):
    """Forward Freight Agreement quote — forward-looking market expectation,
    useful as a leading indicator / sanity check against the model's own forecast."""

    record_date: date
    route_code: str = Field(..., description="e.g. 'C5' for Capesize W.Australia-Qingdao proxy route")
    contract_month: str = Field(..., description="e.g. '2026-11'")
    rate_usd_per_tonne: float
