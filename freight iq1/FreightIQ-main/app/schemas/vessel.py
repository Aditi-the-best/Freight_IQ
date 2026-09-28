"""
Schemas for section 1 (vessel/port operational features from daily line-up
files) and section 2 (port physical constraints, mostly-fixed data) of the
feature list.
"""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, model_validator

from app.constants import VesselClass


class VesselLineupRecord(BaseModel):
    """One row from a daily port line-up file."""

    record_date: date
    port: str
    berth: Optional[str] = None

    vessel_name: str
    vessel_class: VesselClass

    dwt: Optional[float] = Field(None, description="Deadweight tonnage, tonnes")
    loa: Optional[float] = Field(None, description="Length overall, metres")
    beam: Optional[float] = Field(None, description="Beam, metres")
    draft: Optional[float] = Field(None, description="Laden draft, metres")

    origin_port: Optional[str] = None
    origin_country: Optional[str] = None

    arrived_date: Optional[date] = None
    etcd_date: Optional[date] = Field(None, description="Estimated/actual completion & departure date")

    cargo_qty_tonnes: Optional[float] = None

    @model_validator(mode="after")
    def check_dates(self):
        if self.arrived_date and self.etcd_date and self.etcd_date < self.arrived_date:
            raise ValueError("etcd_date cannot be before arrived_date")
        return self


class VesselLineupOut(VesselLineupRecord):
    id: int
    turnaround_days: Optional[float] = Field(
        None, description="Derived: (etcd_date - arrived_date) in days"
    )

    class Config:
        from_attributes = True


class VesselDimensionCheck(BaseModel):
    """Result of checking a vessel's dimensions against a port's constraints."""

    vessel_class: VesselClass
    port: str
    fits: bool
    reasons: list[str] = Field(default_factory=list)
