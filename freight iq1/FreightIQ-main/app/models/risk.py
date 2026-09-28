from sqlalchemy import Column, Integer, String, Date
from app.db.session import Base


class RiskEvent(Base):
    __tablename__ = "risk_event"

    id = Column(Integer, primary_key=True, index=True)
    event_date = Column(Date, nullable=False, index=True)
    affected_route = Column(String, nullable=True, index=True)
    affected_region = Column(String, nullable=True, index=True)
    risk_tier = Column(String, nullable=False, index=True)  # low/medium/high
    description = Column(String, nullable=False)
    expected_duration_days = Column(Integer, nullable=True)
    source = Column(String, nullable=True)
