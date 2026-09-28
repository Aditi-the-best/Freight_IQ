"""
Expected Output D — Risk Mitigation: early warnings on freight-market
volatility, port congestion, and disruption events before they seriously
affect the chartering decision.
"""

from __future__ import annotations
from datetime import date

import pandas as pd

from app.schemas.risk import RiskAlert
from app.schemas.forecast import ForecastResponse


def volatility_alert(forecast: ForecastResponse, volatility_threshold_pct: float = 8.0) -> RiskAlert | None:
    """Flags high forecast-band width relative to the predicted rate as a
    volatility warning (wide confidence bands = high market uncertainty)."""
    if not forecast.points:
        return None
    widths_pct = [
        ((p.upper_bound - p.lower_bound) / p.predicted_rate_usd_per_tonne * 100)
        for p in forecast.points
        if p.upper_bound is not None and p.lower_bound is not None and p.predicted_rate_usd_per_tonne
    ]
    if not widths_pct:
        return None
    avg_width_pct = sum(widths_pct) / len(widths_pct)
    if avg_width_pct >= volatility_threshold_pct:
        return RiskAlert(
            generated_at=date.today(),
            route=f"{forecast.origin_country}-{forecast.destination_port}",
            risk_tier="high" if avg_width_pct >= volatility_threshold_pct * 1.5 else "medium",
            headline="Elevated freight-market volatility forecast",
            detail=(
                f"Forecast confidence band averages ~{avg_width_pct:.1f}% of the predicted "
                f"rate over the horizon — wider than usual. Consider hedging exposure or "
                f"shortening the commitment period."
            ),
        )
    return None


def congestion_alert(port: str, congestion_df: pd.DataFrame, waiting_threshold_days: float = 2.0) -> RiskAlert | None:
    """congestion_df: recent PortCongestionSnapshot rows for this port."""
    if congestion_df.empty:
        return None
    latest = congestion_df.sort_values("snapshot_date").iloc[-1]
    avg_wait = latest.get("avg_waiting_days")
    if avg_wait is not None and avg_wait >= waiting_threshold_days:
        tier = "high" if avg_wait >= waiting_threshold_days * 2 else "medium"
        return RiskAlert(
            generated_at=date.today(),
            port=port,
            risk_tier=tier,
            headline=f"Congestion building at {port}",
            detail=(
                f"Vessels are currently waiting an average of {avg_wait:.1f} days at {port} "
                f"({int(latest.get('vessels_waiting', 0))} vessels waiting). Factor this into "
                f"turnaround and idle-time planning."
            ),
        )
    return None


def disruption_alerts(active_events_df: pd.DataFrame) -> list[RiskAlert]:
    """active_events_df: RiskEvent rows still within their expected_duration_days window."""
    alerts = []
    for _, row in active_events_df.iterrows():
        alerts.append(
            RiskAlert(
                generated_at=date.today(),
                route=row.get("affected_route"),
                risk_tier=row.get("risk_tier", "medium"),
                headline=f"Active disruption: {row.get('affected_region') or row.get('affected_route')}",
                detail=row.get("description", ""),
            )
        )
    return alerts


def compile_risk_alerts(
    forecast: ForecastResponse | None = None,
    congestion_df: pd.DataFrame | None = None,
    port: str | None = None,
    active_events_df: pd.DataFrame | None = None,
) -> list[RiskAlert]:
    alerts: list[RiskAlert] = []
    if forecast is not None:
        v = volatility_alert(forecast)
        if v:
            alerts.append(v)
    if congestion_df is not None and port is not None:
        c = congestion_alert(port, congestion_df)
        if c:
            alerts.append(c)
    if active_events_df is not None and not active_events_df.empty:
        alerts.extend(disruption_alerts(active_events_df))
    return alerts
