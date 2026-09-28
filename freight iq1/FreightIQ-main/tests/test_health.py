from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
client.__enter__()  # triggers lifespan startup (creates fallback SQLite tables)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_port_constraints_fallback():
    resp = client.get("/ports/constraints")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    assert any(p["port"] == "Paradip" for p in data)


def test_vessel_recommendation():
    resp = client.post(
        "/recommend/vessel",
        params={
            "cargo_qty_tonnes": 70000,
            "origin_country": "Australia",
            "destination_port": "Paradip",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["recommended_vessel_class"] in ["Handysize", "Supramax", "Panamax", "Capesize"]
