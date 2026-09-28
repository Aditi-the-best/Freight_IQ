from typing import Optional
from pydantic import BaseModel, Field

from app.constants import VesselClass


class PortConstraints(BaseModel):
    """Mostly-fixed physical constraints for a port (section 2 of feature list)."""

    port: str
    country: str = "India"

    num_berths: int
    max_vessel_class: VesselClass

    max_loa: Optional[float] = Field(None, description="Max length overall, metres")
    max_beam: Optional[float] = Field(None, description="Max beam, metres")
    max_draft: Optional[float] = Field(None, description="Max permissible draft, metres")

    cargo_handling_rate_tpd: Optional[float] = Field(
        None, description="Typical/contracted cargo handling rate, tonnes/day"
    )


class PortConstraintsOut(PortConstraints):
    id: int

    class Config:
        from_attributes = True


class PortMapNode(BaseModel):
    """One point on the Port Map — either an origin loading port or an
    East Coast Indian port."""

    name: str
    role: str = Field(..., description="'origin' | 'destination'")
    country: str
    lat: float
    lon: float


class PortMapLane(BaseModel):
    """One origin -> destination lane for the Port Map nav item."""

    origin_port: str
    origin_country: str
    destination_port: str
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float


class PortMapResponse(BaseModel):
    nodes: list[PortMapNode]
    lanes: list[PortMapLane]


class PortCongestionSnapshot(BaseModel):
    """Real-time-ish congestion signal for a port (feeds Problem #4 / risk)."""

    port: str
    snapshot_date: str  # ISO date; kept as str to allow intraday feeds later
    vessels_waiting: int = 0
    avg_waiting_days: Optional[float] = None
    berths_occupied: Optional[int] = None
    berths_available: Optional[int] = None