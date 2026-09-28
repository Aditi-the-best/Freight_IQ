from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.forecasting.predict import forecast_route
from app.schemas.forecast import ForecastRequest, ForecastResponse

router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.post("/route", response_model=ForecastResponse)
def get_route_forecast(payload: ForecastRequest, db: Session = Depends(get_db)):
    try:
        return forecast_route(
            db,
            origin_country=payload.origin_country,
            destination_port=payload.destination_port,
            vessel_class=payload.vessel_class,
            horizon_days=payload.horizon_days,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
