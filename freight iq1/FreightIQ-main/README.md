# SAIL Freight Forecasting & Vessel Chartering — Backend

Backend for SIH26006 (SAIL / Ministry of Steel — freight forecasting +
vessel chartering decision support). This covers everything **except** the
database itself, which a teammate is building separately.

## How it plugs into the DB your teammate owns

Only **one thing** needs to change once the real Postgres/Supabase DB is
ready: set `DATABASE_URL` in `app/config.py` (or a `.env` file). Everything
else — routers, services, ingestion, forecasting — talks to the DB only
through `app/db/session.py`'s `get_db()` dependency and the SQLAlchemy
models in `app/models/`.

Until then, the app runs against a local SQLite file
(`dev_fallback.db`, auto-created) so you can develop and test the whole
pipeline standalone.

If your teammate's actual table/column names differ from `app/models/`,
you only need to update:
1. `app/models/*.py` (column defs), and
2. the small number of raw queries in `app/ingestion/*.py`,
   `app/forecasting/train.py`, and the API routers that reference them.

Everything else (schemas, feature engineering, forecasting, recommendation
logic) is decoupled from the exact DB schema.

## Project layout

```
app/
  constants.py         Vessel class specs (DWT/LOA/beam/draft), East Coast port seed data
  config.py             Settings (DATABASE_URL lives here)
  db/session.py         get_db() dependency + SQLAlchemy engine/session
  schemas/               Pydantic request/response models
    vessel.py            Line-up records (section 1 of feature list)
    port.py               Port constraints + congestion (section 2)
    freight.py             BDI, FX, freight rate observations, FFA quotes (section 4)
    trade.py                Monthly coal import volume (section 5)
    risk.py                   Risk/disruption events (section 6)
    forecast.py                Forecast + all 4 recommendation-engine outputs
  models/                 SQLAlchemy ORM tables mirroring the schemas above
  ingestion/               One parser/loader per data source
    vessel_lineup_ingestion.py     Daily port line-up CSV/XLSX -> DB
    freight_market_ingestion.py    BDI / FX / freight rates / FFA CSVs -> DB
    trade_data_ingestion.py         Monthly coal import volume CSV -> DB
    risk_event_ingestion.py          Single-event creation + batch CSV backfill
  features/
    feature_engineering.py    Turnaround days, port-congestion rolling stats,
                                market feature joins (lags, rolling mean/std,
                                seasonality), port-fit checker (draft/LOA/beam/
                                berth vs vessel class)
    labels.py                  "Should-have-waited" derived label (section 7)
  forecasting/
    freight_forecaster.py     Holt-Winters model w/ naive-linear fallback
    train.py                    Batch job: fits + pickles one model per route+class
    predict.py                   Loads a trained model (or fits on the fly) for API use
  recommendation/              One module per "Expected Output" in the PS
    market_timing.py            A: charter now / wait / watch
    vessel_selector.py           B: which vessel class, given cargo + port limits
    idle_deadhead_optimizer.py    C: idle-risk flagging + alternative routing
    risk_engine.py                 D: volatility / congestion / disruption alerts
    charting_strategy.py            Spot vs short/mid-term multi-voyage (sections 9-10)
  api/routes/                    FastAPI routers, one per domain, plus:
    dashboard.py                  The single endpoint the frontend dashboard calls
  main.py                          FastAPI app, wires all routers + table creation
tests/
  test_health.py                   Smoke tests (health check, port fallback, vessel rec)
```

## Running it

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Then open `http://127.0.0.1:8000/docs` for interactive API docs.

Run tests:
```bash
pytest tests/ -v
```

## Typical flow

1. **Ingest data** — POST CSV/XLSX files to:
   - `/vessels/lineup/upload` (daily line-up files)
   - `/freight/upload/{baltic_index|fx_rate|rate_observations|ffa_quotes}`
   - `/trade/upload/coal-import-volume`
   - `/risk/events` (single event) or the batch CSV loader in
     `app/ingestion/risk_event_ingestion.py`

2. **(Optional) Train forecasters offline** for faster API responses:
   ```bash
   python -m app.forecasting.train
   ```
   This fits one model per (origin_country, destination_port, vessel_class)
   combination found in the freight rate data and pickles it to
   `app/forecasting/artifacts/`. If skipped, `/forecast/route` just fits
   on-the-fly from whatever history is in the DB.

3. **Query the dashboard** — POST to `/dashboard/query` with cargo qty,
   origin, destination (and optionally desired contract duration + planned
   shipment count). Returns forecast + recommended vessel + market-entry
   timing + risk alerts + spot-vs-multi-voyage recommendation, in one
   response — matching section 17 of the PS.

Individual pieces are also exposed separately under `/forecast/route`,
`/recommend/market-entry`, `/recommend/vessel`, `/recommend/charting-strategy`,
and `/ports/constraints` if the frontend wants to call them independently.

## What's intentionally left as a placeholder

- **Real BDI/FFA data feeds** — ingestion expects a CSV; wiring an actual
  live feed (Baltic Exchange, a broker API, etc.) is a separate task once
  you have access to one.
- **Global economic indicators / commodity-price trends** — mentioned in
  the PS's data list but no schema/ingestion built yet, per your note that
  it's not needed right now. `app/schemas/` and `app/ingestion/` are the
  two places to extend when it's time — follow the same pattern as
  `trade_data_ingestion.py`.
- **ML-grade forecasting model** — `FreightForecaster` is a solid,
  explainable baseline (Holt-Winters) sized for hackathon-scale history.
  Swapping in LightGBM/XGBoost on the engineered features from
  `feature_engineering.py`, or Prophet, only requires changing
  `freight_forecaster.py` — nothing else depends on its internals beyond
  `.fit()` / `.predict()` / `.trend_label()`.
