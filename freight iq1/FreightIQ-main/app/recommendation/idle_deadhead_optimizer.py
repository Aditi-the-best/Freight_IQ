"""
Expected Output C — Idle Scenario Management: forecast periods of likely
low demand/idle capacity and suggest alternative employment or better
positioning to reduce idle time and deadheading (Problem #5 / #8 in the PS).

MVP approach: flag idle risk from recent turnaround-time trends + the
demand forecast (via coal import volume trend and freight rate trend for
the vessel's typical routes). A fuller version would optimize positioning
across multiple candidate next-cargo routes; that's left as an extension
point (candidate_routes param) once live vessel-position data exists.
"""

from __future__ import annotations
from datetime import date, timedelta

import pandas as pd

from app.schemas.forecast import IdleDeadheadRecommendation
from app.constants import VesselClass, ORIGIN_COUNTRIES


def assess_idle_risk(
    vessel_class: VesselClass,
    recent_turnaround_days: pd.Series,
    demand_trend: str,
    vessel_name: str | None = None,
    candidate_routes: list[str] | None = None,
) -> IdleDeadheadRecommendation:
    """
    recent_turnaround_days: recent per-call turnaround-time observations for
        this vessel class (from vessel_lineup), used as an operational-tempo
        proxy — a lengthening trend suggests slack building up in the system.
    demand_trend: 'rising' | 'falling' | 'flat' (e.g. from coal import volume
        trend or the freight rate forecast trend for this class's main routes).
    """
    candidate_routes = candidate_routes or ORIGIN_COUNTRIES

    avg_turnaround = float(recent_turnaround_days.mean()) if len(recent_turnaround_days) else None
    turnaround_trend_up = (
        len(recent_turnaround_days) >= 4
        and recent_turnaround_days.iloc[-2:].mean() > recent_turnaround_days.iloc[:2].mean() * 1.1
    )

    if demand_trend == "falling" and turnaround_trend_up:
        idle_risk = "high"
        action = (
            f"Demand is softening and turnaround times are lengthening for {vessel_class.value} "
            f"vessels — proactively seek alternative cargo/routes now rather than waiting idle."
        )
    elif demand_trend == "falling" or turnaround_trend_up:
        idle_risk = "medium"
        action = (
            f"Some early signs of slack for {vessel_class.value} — start scanning "
            f"alternative routes as a contingency."
        )
    else:
        idle_risk = "low"
        action = "No significant idle risk detected; continue standard planning."

    window_start = date.today() + timedelta(days=3) if idle_risk != "low" else None
    window_end = date.today() + timedelta(days=14) if idle_risk != "low" else None

    return IdleDeadheadRecommendation(
        vessel_name=vessel_name,
        vessel_class=vessel_class,
        idle_risk=idle_risk,
        idle_window_start=window_start,
        idle_window_end=window_end,
        suggested_action=action,
        alternative_routes=candidate_routes if idle_risk != "low" else [],
    )
