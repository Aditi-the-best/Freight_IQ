"""
ORM table definitions.

These mirror the Pydantic schemas in app/schemas/. They exist so the rest
of the backend (services, routers) has real tables to query while the
teammate finalizes the actual Postgres/Supabase schema. If their schema
differs (column names, extra normalization, etc.), only this file + the
service-layer query functions need to change — routers and schemas stay
the same.
"""

from sqlalchemy import Column, Integer, String, Float, Date
from app.db.session import Base


class VesselLineup(Base):
    __tablename__ = "vessel_lineup"

    id = Column(Integer, primary_key=True, index=True)
    record_date = Column(Date, nullable=False, index=True)
    port = Column(String, nullable=False, index=True)
    berth = Column(String, nullable=True)

    vessel_name = Column(String, nullable=False)
    vessel_class = Column(String, nullable=False, index=True)

    dwt = Column(Float, nullable=True)
    loa = Column(Float, nullable=True)
    beam = Column(Float, nullable=True)
    draft = Column(Float, nullable=True)

    origin_port = Column(String, nullable=True)
    origin_country = Column(String, nullable=True, index=True)

    arrived_date = Column(Date, nullable=True)
    etcd_date = Column(Date, nullable=True)

    cargo_qty_tonnes = Column(Float, nullable=True)


class PortConstraints(Base):
    __tablename__ = "port_constraints"

    id = Column(Integer, primary_key=True, index=True)
    port = Column(String, nullable=False, unique=True, index=True)
    country = Column(String, default="India")

    num_berths = Column(Integer, nullable=False)
    max_vessel_class = Column(String, nullable=False)

    max_loa = Column(Float, nullable=True)
    max_beam = Column(Float, nullable=True)
    max_draft = Column(Float, nullable=True)
    cargo_handling_rate_tpd = Column(Float, nullable=True)
