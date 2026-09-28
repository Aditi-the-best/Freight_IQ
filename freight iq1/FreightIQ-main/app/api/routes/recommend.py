from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.forecasting.predict import forecast_route
from app.models.freight import FreightRateObservation
from app.recommendation.market_timing import recommend_market_entry
from app.recommendation.vessel_selector import recommend_vessel
from app.recommendation.charting_strategy import recommend_charting_strategy
from app.schemas.forecast import (
    ForecastRequest,
    MarketEntryRecommendation,
    VesselOptimizationRecommendation,
    ChartingStrategyRecommendation,
)
from app.constants import VesselClass

router = APIRouter(prefix="/recommend", tags=["recommendations"])


def _current_rate(db: Session, origin_country: str, destination_port: str, vessel_class: VesselClass) -> float:
    row = (
        db.query(FreightRateObservation)
        .filter(
            FreightRateObservation.origin_country == origin_country,
            FreightRateObservation.destination_port == destination_port,
            FreightRateObservation.vessel_class == vessel_class.value,
        )
        .order_by(FreightRateObservation.record_date.desc())
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="No current freight rate available for this route/class")
    return row.rate_usd_per_tonne


@router.post("/market-entry", response_model=MarketEntryRecommendation)
def market_entry(payload: ForecastRequest, db: Session = Depends(get_db)):
    try:
        forecast = forecast_route(
            db, payload.origin_country, payload.destination_port, payload.vessel_class, payload.horizon_days
        )
        current = _current_rate(db, payload.origin_country, payload.destination_port, payload.vessel_class)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return recommend_market_entry(forecast, current)


@router.post("/vessel", response_model=VesselOptimizationRecommendation)
def vessel_recommendation(
    cargo_qty_tonnes: float,
    origin_country: str,
    destination_port: str,
):
    return recommend_vessel(cargo_qty_tonnes, origin_country, destination_port)


@router.post("/charting-strategy", response_model=ChartingStrategyRecommendation)
def charting_strategy(
    payload: ForecastRequest,
    planned_shipment_count: int,
    planned_period_months: int,
    db: Session = Depends(get_db),
):
    try:
        forecast = forecast_route(
            db, payload.origin_country, payload.destination_port, payload.vessel_class, payload.horizon_days
        )
        current = _current_rate(db, payload.origin_country, payload.destination_port, payload.vessel_class)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return recommend_charting_strategy(forecast, current, planned_shipment_count, planned_period_months)
