"""
Expected Output A — Optimal Market Entry: should SAIL charter now or wait?

Rule-based on top of the forecast (not a separate ML model): compares
today's implied rate against the forecast trajectory over the horizon and
returns charter_now / wait / watch with a plain-language rationale.

This is intentionally simple and auditable for an MVP/hackathon — the
should_have_waited label (app/features/labels.py) is what you'd use later
to backtest and tune the thresholds below against real outcomes.
"""

from __future__ import annotations
from datetime import date, timedelta

from app.schemas.forecast import ForecastResponse, MarketEntryRecommendation
from app.constants import VesselClass

WAIT_THRESHOLD_PCT = 0.03   # forecast must dip >3% below current to recommend "wait"
RISE_THRESHOLD_PCT = 0.03   # forecast must rise >3% to recommend "charter_now" urgently


def recommend_market_entry(
    forecast: ForecastResponse,
    current_rate: float,
) -> MarketEntryRecommendation:
    if not forecast.points:
        raise ValueError("Forecast has no points to base a recommendation on")

    min_point = min(forecast.points, key=lambda p: p.predicted_rate_usd_per_tonne)
    max_point = max(forecast.points, key=lambda p: p.predicted_rate_usd_per_tonne)

    min_drop_pct = (current_rate - min_point.predicted_rate_usd_per_tonne) / current_rate
    max_rise_pct = (max_point.predicted_rate_usd_per_tonne - current_rate) / current_rate

    if min_drop_pct > WAIT_THRESHOLD_PCT and min_point.forecast_date > date.today():
        return MarketEntryRecommendation(
            origin_country=forecast.origin_country,
            destination_port=forecast.destination_port,
            vessel_class=forecast.vessel_class,
            recommendation="wait",
            confidence=min(0.95, 0.5 + min_drop_pct),
            rationale=(
                f"Forecast shows rates dipping ~{min_drop_pct*100:.1f}% to "
                f"${min_point.predicted_rate_usd_per_tonne:.1f}/t around "
                f"{min_point.forecast_date.isoformat()}. Waiting is likely favourable "
                f"unless the cargo has a hard shipping deadline before then."
            ),
            suggested_window_start=min_point.forecast_date - timedelta(days=3),
            suggested_window_end=min_point.forecast_date + timedelta(days=3),
        )

    if max_rise_pct > RISE_THRESHOLD_PCT and forecast.trend == "rising":
        return MarketEntryRecommendation(
            origin_country=forecast.origin_country,
            destination_port=forecast.destination_port,
            vessel_class=forecast.vessel_class,
            recommendation="charter_now",
            confidence=min(0.95, 0.5 + max_rise_pct),
            rationale=(
                f"Forecast trend is rising, with rates potentially reaching "
                f"${max_point.predicted_rate_usd_per_tonne:.1f}/t by "
                f"{max_point.forecast_date.isoformat()} (+{max_rise_pct*100:.1f}%). "
                f"Securing the charter now avoids that increase."
            ),
        )

    return MarketEntryRecommendation(
        origin_country=forecast.origin_country,
        destination_port=forecast.destination_port,
        vessel_class=forecast.vessel_class,
        recommendation="watch",
        confidence=0.5,
        rationale=(
            "Forecast is roughly flat over the horizon — no strong signal to rush "
            "or delay. Charter based on operational need; monitor for new data."
        ),
    )
