from sqlalchemy import Column, Integer, String, Float
from app.db.session import Base


class CoalImportVolume(Base):
    __tablename__ = "coal_import_volume"

    id = Column(Integer, primary_key=True, index=True)
    year_month = Column(String, nullable=False, index=True)  # 'YYYY-MM'
    origin_country = Column(String, nullable=False, index=True)
    volume_tonnes = Column(Float, nullable=False)
