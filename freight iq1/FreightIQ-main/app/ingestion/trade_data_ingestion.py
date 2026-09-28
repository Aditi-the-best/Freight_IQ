"""Ingests monthly coal import volume by origin country (section 5)."""

from __future__ import annotations
import pandas as pd
from sqlalchemy.orm import Session

from app.models.trade import CoalImportVolume
from app.schemas.trade import CoalImportVolume as CoalImportVolumeSchema


def ingest_coal_import_volume_csv(db: Session, path: str) -> int:
    """Expected columns: year_month ('YYYY-MM'), origin_country, volume_tonnes."""
    df = pd.read_csv(path)
    df.columns = [c.lower().strip() for c in df.columns]
    count = 0
    for _, row in df.iterrows():
        rec = CoalImportVolumeSchema(
            year_month=str(row["year_month"]),
            origin_country=row["origin_country"],
            volume_tonnes=row["volume_tonnes"],
        )
        db.add(
            CoalImportVolume(
                year_month=rec.year_month,
                origin_country=rec.origin_country,
                volume_tonnes=rec.volume_tonnes,
            )
        )
        count += 1
    db.commit()
    return count
