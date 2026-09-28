"""
The single endpoint the logistics-manager-facing dashboard calls (section
17 of the PS): enter cargo qty + origin + destination (+ optional planning
horizon), get back forecast + vessel pick + timing + risk in one response.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.forecasting.predict import forecast_route
from app.models.freight import FreightRateObservation
from app.models.risk import RiskEvent as RiskEventModel
from app.recommendation.market_timing import recommend_market_entry
from app.recommendation.vessel_selector import recommend_vessel
from app.recommendation.charting_strategy import recommend_charting_strategy
from app.recommendation.risk_engine import compile_risk_alerts
from app.schemas.forecast import DashboardQuery, DashboardResponse
from app.config import settings

import pandas as pd

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.post("/query", response_model=DashboardResponse)
def run_dashboard_query(payload: DashboardQuery, db: Session = Depends(get_db)):
    vessel_rec = recommend_vessel(
        payload.cargo_qty_tonnes, payload.origin_country, payload.destination_port
    )
    vessel_class = vessel_rec.recommended_vessel_class

    try:
        forecast = forecast_route(
            db, payload.origin_country, payload.destination_port, vessel_class,
            horizon_days=settings.DEFAULT_FORECAST_HORIZON_DAYS,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    current_row = (
        db.query(FreightRateObservation)
        .filter(
            FreightRateObservation.origin_country == payload.origin_country,
            FreightRateObservation.destination_port == payload.destination_port,
            FreightRateObservation.vessel_class == vessel_class.value,
        )
        .order_by(FreightRateObservation.record_date.desc())
        .first()
    )
    current_rate = current_row.rate_usd_per_tonne if current_row else forecast.points[0].predicted_rate_usd_per_tonne

    market_entry = recommend_market_entry(forecast, current_rate)

    charting_strategy = None
    if payload.desired_contract_duration_months and (payload.planned_shipment_count or 1) > 1:
        charting_strategy = recommend_charting_strategy(
            forecast, current_rate, payload.planned_shipment_count or 1,
            payload.desired_contract_duration_months,
        )

    active_events = db.query(RiskEventModel).order_by(RiskEventModel.event_date.desc()).limit(20).all()
    events_df = pd.DataFrame(
        [
            {
                "affected_route": e.affected_route,
                "affected_region": e.affected_region,
                "risk_tier": e.risk_tier,
                "description": e.description,
            }
            for e in active_events
        ]
    )
    risk_alerts = compile_risk_alerts(forecast=forecast, active_events_df=events_df)

    return DashboardResponse(
        forecast=forecast,
        vessel_recommendation=vessel_rec,
        market_entry=market_entry,
        charting_strategy=charting_strategy,
        risk_alerts=[a.model_dump() for a in risk_alerts],
    )
