"""
Ingests daily freight/market data (section 4): Baltic Dry Index + sub
indices, USD/INR FX rate, and (when available) FFA quotes and observed
freight-rate fixtures.

Each source has its own small parser since they typically come from
different feeds. All write into their respective tables via SQLAlchemy.
"""

from __future__ import annotations
import pandas as pd
from sqlalchemy.orm import Session

from app.models.freight import BalticIndex, FxRate, FreightRateObservation, FFAQuote
from app.schemas.freight import (
    BalticIndexRecord,
    FxRateRecord,
    FreightRateObservation as FreightRateObservationSchema,
    FFAQuote as FFAQuoteSchema,
)


def ingest_baltic_index_csv(db: Session, path: str) -> int:
    """Expected columns: date, bdi, bci, bpi, bsi, bhsi (sub-indices optional)."""
    df = pd.read_csv(path)
    df.columns = [c.lower().strip() for c in df.columns]
    count = 0
    for _, row in df.iterrows():
        rec = BalticIndexRecord(
            record_date=row["date"],
            bdi=row["bdi"],
            bci=row.get("bci"),
            bpi=row.get("bpi"),
            bsi=row.get("bsi"),
            bhsi=row.get("bhsi"),
        )
        db.merge(
            BalticIndex(
                record_date=rec.record_date, bdi=rec.bdi, bci=rec.bci,
                bpi=rec.bpi, bsi=rec.bsi, bhsi=rec.bhsi,
            )
        )
        count += 1
    db.commit()
    return count


def ingest_fx_rate_csv(db: Session, path: str) -> int:
    """Expected columns: date, usd_inr."""
    df = pd.read_csv(path)
    df.columns = [c.lower().strip() for c in df.columns]
    count = 0
    for _, row in df.iterrows():
        rec = FxRateRecord(record_date=row["date"], usd_inr=row["usd_inr"])
        db.merge(FxRate(record_date=rec.record_date, usd_inr=rec.usd_inr))
        count += 1
    db.commit()
    return count


def ingest_freight_rate_observations_csv(db: Session, path: str) -> int:
    """Expected columns: date, origin_country, destination_port, vessel_class,
    rate_usd_per_tonne, source (optional)."""
    df = pd.read_csv(path)
    df.columns = [c.lower().strip() for c in df.columns]
    count = 0
    for _, row in df.iterrows():
        rec = FreightRateObservationSchema(
            record_date=row["date"],
            origin_country=row["origin_country"],
            destination_port=row["destination_port"],
            vessel_class=row["vessel_class"],
            rate_usd_per_tonne=row["rate_usd_per_tonne"],
            source=row.get("source"),
        )
        db.add(
            FreightRateObservation(
                record_date=rec.record_date,
                origin_country=rec.origin_country,
                destination_port=rec.destination_port,
                vessel_class=rec.vessel_class.value,
                rate_usd_per_tonne=rec.rate_usd_per_tonne,
                source=rec.source,
            )
        )
        count += 1
    db.commit()
    return count


def ingest_ffa_quotes_csv(db: Session, path: str) -> int:
    """Expected columns: date, route_code, contract_month, rate_usd_per_tonne.
    Optional data source — ingest opportunistically when a feed is available."""
    df = pd.read_csv(path)
    df.columns = [c.lower().strip() for c in df.columns]
    count = 0
    for _, row in df.iterrows():
        rec = FFAQuoteSchema(
            record_date=row["date"],
            route_code=row["route_code"],
            contract_month=str(row["contract_month"]),
            rate_usd_per_tonne=row["rate_usd_per_tonne"],
        )
        db.add(
            FFAQuote(
                record_date=rec.record_date,
                route_code=rec.route_code,
                contract_month=rec.contract_month,
                rate_usd_per_tonne=rec.rate_usd_per_tonne,
            )
        )
        count += 1
    db.commit()
    return count
