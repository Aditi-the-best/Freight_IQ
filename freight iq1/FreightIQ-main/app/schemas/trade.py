from pydantic import BaseModel, Field


class CoalImportVolume(BaseModel):
    """Monthly coal import volume by origin country into India."""

    year_month: str = Field(..., description="'YYYY-MM'")
    origin_country: str
    volume_tonnes: float
