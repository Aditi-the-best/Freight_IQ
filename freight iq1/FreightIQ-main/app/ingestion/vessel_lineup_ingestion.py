"""
Ingests daily port line-up files (section 1 feature list) into the
vessel_lineup table.

Expected input: CSV/Excel with (at least) columns —
    date, port, berth, vessel_name, vessel_class, dwt, loa, beam, draft,
    origin_port, origin_country, arrived_date, etcd_date, cargo_qty_tonnes

Column names are matched case-insensitively and a few common aliases are
accepted (see COLUMN_ALIASES) since real-world line-up files rarely agree
on naming.
"""

from __future__ import annotations
import pandas as pd
from datetime import date
from sqlalchemy.orm import Session

from app.models.vessel import VesselLineup
from app.schemas.vessel import VesselLineupRecord

COLUMN_ALIASES = {
    "record_date": ["date", "record_date", "lineup_date"],
    "port": ["port", "discharge_port"],
    "berth": ["berth", "berth_no"],
    "vessel_name": ["vessel_name", "vessel", "ship_name"],
    "vessel_class": ["vessel_class", "class", "vessel_type"],
    "dwt": ["dwt", "deadweight"],
    "loa": ["loa", "length_overall"],
    "beam": ["beam", "width"],
    "draft": ["draft", "draught"],
    "origin_port": ["origin_port", "load_port"],
    "origin_country": ["origin_country", "load_country"],
    "arrived_date": ["arrived_date", "arrival_date", "eta_actual"],
    "etcd_date": ["etcd_date", "etcd", "departure_date", "etd"],
    "cargo_qty_tonnes": ["cargo_qty_tonnes", "cargo_qty", "quantity_tonnes"],
}


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    lower_map = {c.lower().strip(): c for c in df.columns}
    rename = {}
    for target, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in lower_map:
                rename[lower_map[alias]] = target
                break
    return df.rename(columns=rename)


def parse_lineup_file(path: str) -> list[VesselLineupRecord]:
    """Reads a CSV or Excel line-up file and returns validated records.
    Rows that fail validation are skipped and reported via ValueError
    collection (raised at the end) so the ingestion is all-or-nothing per
    file but you get a full list of problems, not just the first one.
    """
    if path.endswith((".xlsx", ".xls")):
        df = pd.read_excel(path)
    else:
        df = pd.read_csv(path)

    df = _normalize_columns(df)

    records: list[VesselLineupRecord] = []
    errors: list[str] = []

    for i, row in df.iterrows():
        try:
            payload = row.dropna().to_dict()
            records.append(VesselLineupRecord(**payload))
        except Exception as e:  # noqa: BLE001 - collecting per-row errors deliberately
            errors.append(f"row {i}: {e}")

    if errors:
        raise ValueError(
            f"{len(errors)} row(s) failed validation in {path}:\n" + "\n".join(errors[:20])
        )

    return records


def _turnaround_days(rec: VesselLineupRecord) -> float | None:
    if rec.arrived_date and rec.etcd_date:
        return (rec.etcd_date - rec.arrived_date).days
    return None


def persist_lineup_records(db: Session, records: list[VesselLineupRecord]) -> int:
    """Upserts-by-insert (simple append; dedup/upsert logic can be added once
    the real DB's unique constraints are known) into vessel_lineup."""
    objs = []
    for rec in records:
        objs.append(
            VesselLineup(
                record_date=rec.record_date,
                port=rec.port,
                berth=rec.berth,
                vessel_name=rec.vessel_name,
                vessel_class=rec.vessel_class.value,
                dwt=rec.dwt,
                loa=rec.loa,
                beam=rec.beam,
                draft=rec.draft,
                origin_port=rec.origin_port,
                origin_country=rec.origin_country,
                arrived_date=rec.arrived_date,
                etcd_date=rec.etcd_date,
                cargo_qty_tonnes=rec.cargo_qty_tonnes,
            )
        )
    db.add_all(objs)
    db.commit()
    return len(objs)


def ingest_lineup_file(db: Session, path: str) -> int:
    records = parse_lineup_file(path)
    return persist_lineup_records(db, records)
