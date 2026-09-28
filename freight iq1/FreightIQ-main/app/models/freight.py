from sqlalchemy import Column, Integer, String, Float, Date
from app.db.session import Base


class BalticIndex(Base):
    __tablename__ = "baltic_index"

    id = Column(Integer, primary_key=True, index=True)
    record_date = Column(Date, nullable=False, unique=True, index=True)
    bdi = Column(Float, nullable=False)
    bci = Column(Float, nullable=True)
    bpi = Column(Float, nullable=True)
    bsi = Column(Float, nullable=True)
    bhsi = Column(Float, nullable=True)


class FxRate(Base):
    __tablename__ = "fx_rate"

    id = Column(Integer, primary_key=True, index=True)
    record_date = Column(Date, nullable=False, unique=True, index=True)
    usd_inr = Column(Float, nullable=False)


class FreightRateObservation(Base):
    __tablename__ = "freight_rate_observation"

    id = Column(Integer, primary_key=True, index=True)
    record_date = Column(Date, nullable=False, index=True)
    origin_country = Column(String, nullable=False, index=True)
    destination_port = Column(String, nullable=False, index=True)
    vessel_class = Column(String, nullable=False, index=True)
    rate_usd_per_tonne = Column(Float, nullable=False)
    source = Column(String, nullable=True)


class FFAQuote(Base):
    __tablename__ = "ffa_quote"

    id = Column(Integer, primary_key=True, index=True)
    record_date = Column(Date, nullable=False, index=True)
    route_code = Column(String, nullable=False, index=True)
    contract_month = Column(String, nullable=False)
    rate_usd_per_tonne = Column(Float, nullable=False)
