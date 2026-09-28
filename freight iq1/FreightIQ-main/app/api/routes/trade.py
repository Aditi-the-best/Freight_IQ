import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.ingestion.trade_data_ingestion import ingest_coal_import_volume_csv

router = APIRouter(prefix="/trade", tags=["trade"])


@router.post("/upload/coal-import-volume")
def upload_coal_import_volume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    try:
        count = ingest_coal_import_volume_csv(db, tmp_path)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=str(e))
    finally:
        Path(tmp_path).unlink(missing_ok=True)
    return {"ingested_rows": count}
