import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.ingestion.freight_market_ingestion import (
    ingest_baltic_index_csv,
    ingest_fx_rate_csv,
    ingest_freight_rate_observations_csv,
    ingest_ffa_quotes_csv,
)
from app.models.freight import FreightRateObservation
from app.constants import VesselClass

router = APIRouter(prefix="/freight", tags=["freight"])

_INGESTORS = {
    "baltic_index": ingest_baltic_index_csv,
    "fx_rate": ingest_fx_rate_csv,
    "rate_observations": ingest_freight_rate_observations_csv,
    "ffa_quotes": ingest_ffa_quotes_csv,
}


@router.post("/upload/{dataset}", summary="Upload one of: baltic_index, fx_rate, rate_observations, ffa_quotes")
def upload_freight_csv(dataset: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if dataset not in _INGESTORS:
        raise HTTPException(status_code=400, detail=f"Unknown dataset '{dataset}'. Valid: {list(_INGESTORS)}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        count = _INGESTORS[dataset](db, tmp_path)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=str(e))
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    return {"dataset": dataset, "ingested_rows": count}


@router.get("/rates/latest")
def latest_rate(
    origin_country: str,
    destination_port: str,
    vessel_class: VesselClass,
    db: Session = Depends(get_db),
):
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
        raise HTTPException(status_code=404, detail="No freight rate observations found for this route/class")
    return {
        "record_date": row.record_date,
        "rate_usd_per_tonne": row.rate_usd_per_tonne,
        "source": row.source,
    }
