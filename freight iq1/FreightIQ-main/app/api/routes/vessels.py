import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.ingestion.vessel_lineup_ingestion import ingest_lineup_file
from app.models.vessel import VesselLineup
from app.schemas.vessel import VesselLineupOut

router = APIRouter(prefix="/vessels", tags=["vessels"])


@router.post("/lineup/upload", summary="Upload a daily port line-up file (CSV/XLSX)")
def upload_lineup_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    suffix = Path(file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        count = ingest_lineup_file(db, tmp_path)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    return {"ingested_rows": count}


@router.get("/lineup", response_model=list[VesselLineupOut])
def list_lineup(port: str | None = None, limit: int = 100, db: Session = Depends(get_db)):
    q = db.query(VesselLineup)
    if port:
        q = q.filter(VesselLineup.port == port)
    rows = q.order_by(VesselLineup.record_date.desc()).limit(limit).all()

    out = []
    for r in rows:
        turnaround = None
        if r.arrived_date and r.etcd_date:
            turnaround = (r.etcd_date - r.arrived_date).days
        out.append(VesselLineupOut(**{**r.__dict__, "turnaround_days": turnaround}))
    return out
