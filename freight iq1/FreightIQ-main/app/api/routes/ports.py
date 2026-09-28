from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.vessel import PortConstraints as PortConstraintsModel
from app.schemas.port import PortConstraints, PortConstraintsOut, PortMapResponse, PortMapNode, PortMapLane
from app.constants import EAST_COAST_PORTS, ORIGIN_PORT_COORDS, EAST_COAST_PORT_COORDS

router = APIRouter(prefix="/ports", tags=["ports"])


@router.get("/map", response_model=PortMapResponse, summary="Port Map nav item — origin ports connected to East Coast ports")
def port_map():
    """Static reference map data (see app.constants for coordinates) — good
    enough to render the Port Map nav item now. Swap in live coordinates /
    an actual routes table later if origin ports become dynamic."""
    nodes = [
        PortMapNode(name=info["port"], role="origin", country=country, lat=info["lat"], lon=info["lon"])
        for country, info in ORIGIN_PORT_COORDS.items()
    ] + [
        PortMapNode(name=name, role="destination", country="India", lat=coords["lat"], lon=coords["lon"])
        for name, coords in EAST_COAST_PORT_COORDS.items()
    ]

    lanes = [
        PortMapLane(
            origin_port=origin_info["port"],
            origin_country=origin_country,
            destination_port=dest_name,
            origin_lat=origin_info["lat"],
            origin_lon=origin_info["lon"],
            destination_lat=dest_coords["lat"],
            destination_lon=dest_coords["lon"],
        )
        for origin_country, origin_info in ORIGIN_PORT_COORDS.items()
        for dest_name, dest_coords in EAST_COAST_PORT_COORDS.items()
    ]

    return PortMapResponse(nodes=nodes, lanes=lanes)


@router.get("/constraints", response_model=list[PortConstraintsOut])
def list_port_constraints(db: Session = Depends(get_db)):
    rows = db.query(PortConstraintsModel).all()
    if rows:
        return rows
    # fall back to constants seed data if the DB table is empty (e.g. before
    # the teammate's port-constraints table is populated)
    return [
        PortConstraintsOut(
            id=i,
            port=name,
            country=info["country"],
            num_berths=info["num_berths"],
            max_vessel_class=info["max_vessel_class"],
        )
        for i, (name, info) in enumerate(EAST_COAST_PORTS.items(), start=1)
    ]


@router.post("/constraints", response_model=PortConstraintsOut)
def upsert_port_constraints(payload: PortConstraints, db: Session = Depends(get_db)):
    existing = db.query(PortConstraintsModel).filter(PortConstraintsModel.port == payload.port).first()
    if existing:
        for field, value in payload.model_dump().items():
            setattr(existing, field, value.value if hasattr(value, "value") else value)
        db.commit()
        db.refresh(existing)
        return existing

    obj = PortConstraintsModel(
        port=payload.port,
        country=payload.country,
        num_berths=payload.num_berths,
        max_vessel_class=payload.max_vessel_class.value,
        max_loa=payload.max_loa,
        max_beam=payload.max_beam,
        max_draft=payload.max_draft,
        cargo_handling_rate_tpd=payload.cargo_handling_rate_tpd,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj