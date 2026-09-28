"""
Sections 9-10 of the PS: should SAIL keep booking individual spot contracts,
or move to a short/medium-term multi-voyage contract for a known series of
upcoming shipments?

Logic: if the forecast trend over the planning period is 'rising' and
volatility (band width) is meaningful, locking in a multi-voyage contract
at today's blended rate protects against future increases across all
planned shipments. If the trend is 'falling', spot (booking each voyage
separately, later, closer to need) tends to capture the decline instead.
"""

from __future__ import annotations

from app.schemas.forecast import ForecastResponse, ChartingStrategyRecommendation


def recommend_charting_strategy(
    forecast: ForecastResponse,
    current_rate: float,
    planned_shipment_count: int,
    planned_period_months: int,
) -> ChartingStrategyRecommendation:
    if planned_shipment_count <= 1:
        return ChartingStrategyRecommendation(
            origin_country=forecast.origin_country,
            destination_port=forecast.destination_port,
            vessel_class=forecast.vessel_class,
            planned_shipment_count=planned_shipment_count,
            planned_period_months=planned_period_months,
            recommendation="spot",
            rationale="Only a single shipment is planned — a multi-voyage contract offers no benefit here.",
        )

    avg_predicted = sum(p.predicted_rate_usd_per_tonne for p in forecast.points) / len(forecast.points)
    delta_pct = (avg_predicted - current_rate) / current_rate * 100

    if forecast.trend == "rising" and delta_pct > 2:
        savings_pct = min(delta_pct, 25.0)
        return ChartingStrategyRecommendation(
            origin_country=forecast.origin_country,
            destination_port=forecast.destination_port,
            vessel_class=forecast.vessel_class,
            planned_shipment_count=planned_shipment_count,
            planned_period_months=planned_period_months,
            recommendation="multi_voyage",
            rationale=(
                f"Rates are forecast to rise ~{delta_pct:.1f}% on average over the next "
                f"{planned_period_months} months across {planned_shipment_count} planned "
                f"shipments. Locking a short/medium-term multi-voyage contract near today's "
                f"rate avoids repeatedly re-entering a rising spot market."
            ),
            estimated_savings_pct=round(savings_pct, 1),
        )

    if forecast.trend == "falling":
        return ChartingStrategyRecommendation(
            origin_country=forecast.origin_country,
            destination_port=forecast.destination_port,
            vessel_class=forecast.vessel_class,
            planned_shipment_count=planned_shipment_count,
            planned_period_months=planned_period_months,
            recommendation="spot",
            rationale=(
                "Rates are forecast to fall — booking each voyage separately (spot) as it "
                "comes due lets SAIL capture the decline, rather than locking in today's "
                "higher rate for all planned shipments."
            ),
        )

    return ChartingStrategyRecommendation(
        origin_country=forecast.origin_country,
        destination_port=forecast.destination_port,
        vessel_class=forecast.vessel_class,
        planned_shipment_count=planned_shipment_count,
        planned_period_months=planned_period_months,
        recommendation="spot",
        rationale=(
            "Forecast is roughly flat — no clear pricing advantage to a multi-voyage "
            "commitment. Spot keeps flexibility; revisit if the forecast trend shifts."
        ),
    )
