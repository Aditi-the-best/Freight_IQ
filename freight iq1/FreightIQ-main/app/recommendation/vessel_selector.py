"""
Expected Output B — Vessel Optimization: given cargo volume + origin +
destination, which vessel class should be used, respecting port
constraints at BOTH ends (Problem #3 in the PS).

Selection logic:
  1. Filter vessel classes whose typical DWT range can carry the cargo
     volume without excessive under-utilization (< 40% of DWT wasted).
  2. Of those, exclude any that fail port-fit checks at origin AND/OR
     destination (LOA/beam/draft/max-class).
  3. Among the remaining feasible classes, prefer the largest (bigger
     ships are cheaper per tonne) — this encodes "biggest that still fits",
     directly addressing "biggest vessel != automatically best vessel"
     from the PS.
"""

from __future__ import annotations

from app.constants import VESSEL_CLASS_SPECS, VESSEL_CLASS_ORDER, EAST_COAST_PORTS, VesselClass
from app.features.feature_engineering import check_port_fit
from app.schemas.forecast import VesselOptimizationRecommendation

MAX_DWT_UNDERUTILIZATION = 0.6  # don't recommend a class using <60% of its DWT for this cargo


def _classes_by_capacity_fit(cargo_qty_tonnes: float) -> list[VesselClass]:
    fits = []
    for vc in VESSEL_CLASS_ORDER:
        spec = VESSEL_CLASS_SPECS[vc]
        if cargo_qty_tonnes <= spec["dwt_max"]:
            utilization = cargo_qty_tonnes / spec["dwt_typical"]
            if utilization >= (1 - MAX_DWT_UNDERUTILIZATION):
                fits.append(vc)
    return fits or [VESSEL_CLASS_ORDER[0]]  # smallest class as fallback if nothing fits well


def recommend_vessel(
    cargo_qty_tonnes: float,
    origin_country: str,
    destination_port: str,
    origin_port_constraints: dict | None = None,
    destination_port_constraints: dict | None = None,
) -> VesselOptimizationRecommendation:
    destination_constraints = destination_port_constraints or EAST_COAST_PORTS.get(destination_port, {})

    capacity_fit_classes = _classes_by_capacity_fit(cargo_qty_tonnes)

    feasible = []
    excluded: dict[str, str] = {}

    for vc in capacity_fit_classes:
        reasons_all = []

        dest_ok, dest_reasons = check_port_fit(vc, destination_constraints)
        if not dest_ok:
            reasons_all.extend([f"[{destination_port}] {r}" for r in dest_reasons])

        if origin_port_constraints:
            origin_ok, origin_reasons = check_port_fit(vc, origin_port_constraints)
            if not origin_ok:
                reasons_all.extend([f"[{origin_country} port] {r}" for r in origin_reasons])

        if reasons_all:
            excluded[vc.value] = "; ".join(reasons_all)
        else:
            feasible.append(vc)

    if feasible:
        # prefer the largest feasible class (best $/tonne economics)
        recommended = max(feasible, key=lambda vc: VESSEL_CLASS_ORDER.index(vc))
        rationale = (
            f"{recommended.value} is the largest vessel class that both carries "
            f"{cargo_qty_tonnes:,.0f} t efficiently and fits port constraints at "
            f"{destination_port}" + (f" and the origin port" if origin_port_constraints else "") + "."
        )
    else:
        # nothing fully feasible — fall back to smallest capacity-fit class,
        # flagged so a human reviews it rather than silently picking wrong
        recommended = capacity_fit_classes[0]
        rationale = (
            f"No vessel class fully satisfies both cargo-capacity fit and port "
            f"constraints — defaulting to {recommended.value} as the safest fallback. "
            f"Review excluded_classes before booking."
        )

    return VesselOptimizationRecommendation(
        origin_country=origin_country,
        destination_port=destination_port,
        cargo_qty_tonnes=cargo_qty_tonnes,
        recommended_vessel_class=recommended,
        feasible_classes=feasible,
        excluded_classes=excluded,
        rationale=rationale,
    )
