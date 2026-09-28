from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd

from app.api.deps import get_db
from app.ingestion.risk_event_ingestion import create_risk_event
from app.models.risk import RiskEvent as RiskEventModel
from app.schemas.risk import RiskEvent, RiskEventOut, RiskAlert
from app.forecasting.predict import forecast_route
from app.recommendation.risk_engine import compile_risk_alerts
from app.constants import VesselClass

router = APIRouter(prefix="/risk", tags=["risk"])


def _active_events(db: Session) -> list[RiskEventModel]:
    rows = db.query(RiskEventModel).order_by(RiskEventModel.event_date.desc()).limit(50).all()
    return [
        r for r in rows
        if r.expected_duration_days is None
        or (r.event_date + timedelta(days=r.expected_duration_days)) >= date.today()
    ]


@router.post("/events", response_model=RiskEventOut)
def add_risk_event(event: RiskEvent, db: Session = Depends(get_db)):
    obj = create_risk_event(db, event)
    return obj


@router.get("/events", response_model=list[RiskEventOut])
def list_risk_events(active_only: bool = False, db: Session = Depends(get_db)):
    if active_only:
        return _active_events(db)
    return db.query(RiskEventModel).order_by(RiskEventModel.event_date.desc()).all()


@router.get("/alerts", response_model=list[RiskAlert], summary="Risk Monitor nav item — compiled early warnings")
def risk_monitor(
    origin_country: str | None = None,
    destination_port: str | None = None,
    vessel_class: VesselClass | None = None,
    db: Session = Depends(get_db),
):
    """
    Standalone Risk Monitor feed: active disruption events always included;
    forecast-volatility warnings included when a route is given (all three
    of origin_country/destination_port/vessel_class must be supplied
    together to run a forecast).
    """
    forecast = None
    if origin_country and destination_port and vessel_class:
        try:
            forecast = forecast_route(db, origin_country, destination_port, vessel_class, horizon_days=30)
        except ValueError:
            forecast = None  # not enough history yet — still return event-based alerts

    events = _active_events(db)
    events_df = pd.DataFrame(
        [
            {
                "affected_route": e.affected_route,
                "affected_region": e.affected_region,
                "risk_tier": e.risk_tier,
                "description": e.description,
            }
            for e in events
        ]
    )

    return compile_risk_alerts(forecast=forecast, active_events_df=events_df)