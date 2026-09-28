"""
Offline/batch training entry point. Pulls freight rate history + BDI + FX
+ coal import volume per route+class, builds the full engineered feature
table (see app/features/feature_engineering.py), fits an XGBoost
FreightForecaster per route, and pickles each to disk so the API layer can
load pre-fit models instead of refitting on every request.

Run with:  python -m app.forecasting.train
"""

from __future__ import annotations
import pickle
from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.freight import FreightRateObservation, BalticIndex, FxRate
from app.models.trade import CoalImportVolume
from app.forecasting.freight_forecaster import FreightForecaster
from app.features.feature_engineering import merge_market_features

MODEL_DIR = Path(__file__).parent / "artifacts"
MODEL_DIR.mkdir(exist_ok=True)


def _route_key(origin_country: str, destination_port: str, vessel_class: str) -> str:
    return f"{origin_country}__{destination_port}__{vessel_class}".replace(" ", "_")


def load_freight_history(db: Session, origin_country: str, destination_port: str, vessel_class: str) -> pd.DataFrame:
    rows = (
        db.query(FreightRateObservation)
        .filter(
            FreightRateObservation.origin_country == origin_country,
            FreightRateObservation.destination_port == destination_port,
            FreightRateObservation.vessel_class == vessel_class,
        )
        .order_by(FreightRateObservation.record_date)
        .all()
    )
    return pd.DataFrame(
        [
            {
                "record_date": r.record_date,
                "origin_country": r.origin_country,
                "destination_port": r.destination_port,
                "vessel_class": r.vessel_class,
                "rate_usd_per_tonne": r.rate_usd_per_tonne,
            }
            for r in rows
        ]
    )


def load_bdi(db: Session) -> pd.DataFrame:
    rows = db.query(BalticIndex).order_by(BalticIndex.record_date).all()
    return pd.DataFrame(
        [{"record_date": r.record_date, "bdi": r.bdi, "bci": r.bci, "bpi": r.bpi, "bsi": r.bsi, "bhsi": r.bhsi} for r in rows]
    )


def load_fx(db: Session) -> pd.DataFrame:
    rows = db.query(FxRate).order_by(FxRate.record_date).all()
    return pd.DataFrame([{"record_date": r.record_date, "usd_inr": r.usd_inr} for r in rows])


def load_coal_import_volume(db: Session) -> pd.DataFrame:
    rows = db.query(CoalImportVolume).all()
    return pd.DataFrame([{"year_month": r.year_month, "origin_country": r.origin_country, "volume_tonnes": r.volume_tonnes} for r in rows])


def build_features_for_route(db: Session, origin_country: str, destination_port: str, vessel_class: str) -> pd.DataFrame:
    freight_df = load_freight_history(db, origin_country, destination_port, vessel_class)
    if freight_df.empty:
        return freight_df
    bdi_df = load_bdi(db)
    fx_df = load_fx(db)
    coal_df = load_coal_import_volume(db)
    return merge_market_features(freight_df, bdi_df, fx_df, coal_df)


def train_all_routes(min_rows: int = 10) -> int:
    db = SessionLocal()
    try:
        distinct_routes = (
            db.query(
                FreightRateObservation.origin_country,
                FreightRateObservation.destination_port,
                FreightRateObservation.vessel_class,
            )
            .distinct()
            .all()
        )
        trained = 0
        for origin_country, destination_port, vessel_class in distinct_routes:
            features = build_features_for_route(db, origin_country, destination_port, vessel_class)
            if len(features) < min_rows:
                continue  # not enough data yet to bother fitting

            forecaster = FreightForecaster().fit(features)
            key = _route_key(origin_country, destination_port, vessel_class)
            with open(MODEL_DIR / f"{key}.pkl", "wb") as f:
                pickle.dump(forecaster, f)
            trained += 1
        print(f"Trained and saved {trained} route-level XGBoost forecasters to {MODEL_DIR}")
        return trained
    finally:
        db.close()


if __name__ == "__main__":
    train_all_routes()