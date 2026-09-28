"""
Ingests risk/disruption events (section 6). Unlike the other sources this
isn't a daily/monthly batch feed — events get added one at a time (or in
small batches) whenever something happens: a strike, a canal blockage, a
geopolitical flare-up affecting a route, extreme weather, etc.

Exposes both a single-event creator (for manual entry via the API/dashboard)
and a CSV batch loader (for backfilling historical events).
"""

from __future__ import annotations
import pandas as pd
from sqlalchemy.orm import Session

from app.models.risk import RiskEvent as RiskEventModel
from app.schemas.risk import RiskEvent as RiskEventSchema


def create_risk_event(db: Session, event: RiskEventSchema) -> RiskEventModel:
    obj = RiskEventModel(
        event_date=event.event_date,
        affected_route=event.affected_route,
        affected_region=event.affected_region,
        risk_tier=event.risk_tier,
        description=event.description,
        expected_duration_days=event.expected_duration_days,
        source=event.source,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def ingest_risk_events_csv(db: Session, path: str) -> int:
    """Expected columns: event_date, affected_route, affected_region,
    risk_tier, description, expected_duration_days (optional), source (optional)."""
    df = pd.read_csv(path)
    df.columns = [c.lower().strip() for c in df.columns]
    count = 0
    for _, row in df.iterrows():
        rec = RiskEventSchema(
            event_date=row["event_date"],
            affected_route=row.get("affected_route"),
            affected_region=row.get("affected_region"),
            risk_tier=row["risk_tier"],
            description=row["description"],
            expected_duration_days=row.get("expected_duration_days"),
            source=row.get("source"),
        )
        create_risk_event(db, rec)
        count += 1
    return count
