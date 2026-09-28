"""
Reference constants for the SAIL Freight Forecasting & Vessel Chartering system.

VESSEL_CLASS_SPECS holds the *standard* size envelope for each bulk-carrier
class. These are NOT raw features collected per-vessel — they are reference
ranges used to:
  - validate/clean incoming AIS or line-up data (e.g. flag a vessel tagged
    "Panamax" whose LOA falls outside the expected range),
  - check port compatibility when a specific vessel's exact dimensions
    aren't available yet (fall back to class midpoint),
  - power the Vessel Optimization recommendation engine.

Numbers are typical industry ranges (approximate, meant for MVP/hackathon
use — swap in exact class definitions later if precision matters).
"""

from enum import Enum


class VesselClass(str, Enum):
    HANDYSIZE = "Handysize"
    GEARED = "Geared"
    SUPRAMAX = "Supramax"
    PANAMAX = "Panamax"
    CAPESIZE = "Capesize"


# All dimensions in metres, DWT in tonnes.
VESSEL_CLASS_SPECS = {
    VesselClass.HANDYSIZE: {
        "dwt_min": 10_000, "dwt_max": 40_000, "dwt_typical": 32_000,
        "loa_min": 100, "loa_max": 190, "loa_typical": 150,
        "beam_typical": 23.0,
        "draft_typical": 10.0,
        "cargo_handling_rate_tph_typical": 8_000,   # tonnes/day typical discharge
    },
    # "Geared" denotes a vessel fitted with its own cranes (can load/discharge
    # without shore equipment) rather than a strict size tier — but since the
    # PS/USP treats it as a parallel class alongside Handysize/Supramax/etc.,
    # it's modeled here with a Handysize-adjacent size envelope (geared
    # vessels are most commonly built in this range).
    VesselClass.GEARED: {
        "dwt_min": 10_000, "dwt_max": 45_000, "dwt_typical": 35_000,
        "loa_min": 100, "loa_max": 195, "loa_typical": 170,
        "beam_typical": 27.0,
        "draft_typical": 11.0,
        "cargo_handling_rate_tph_typical": 9_000,
        "geared": True,  # can self-load/discharge without shore cranes
    },
    VesselClass.SUPRAMAX: {
        "dwt_min": 40_000, "dwt_max": 60_000, "dwt_typical": 56_000,
        "loa_min": 180, "loa_max": 200, "loa_typical": 190,
        "beam_typical": 32.3,
        "draft_typical": 12.5,
        "cargo_handling_rate_tph_typical": 12_000,
    },
    VesselClass.PANAMAX: {
        "dwt_min": 60_000, "dwt_max": 80_000, "dwt_typical": 75_000,
        "loa_min": 220, "loa_max": 230, "loa_typical": 225,
        "beam_typical": 32.2,
        "draft_typical": 14.5,
        "cargo_handling_rate_tph_typical": 18_000,
    },
    VesselClass.CAPESIZE: {
        "dwt_min": 80_000, "dwt_max": 220_000, "dwt_typical": 180_000,
        "loa_min": 280, "loa_max": 300, "loa_typical": 290,
        "beam_typical": 45.0,
        "draft_typical": 18.0,
        "cargo_handling_rate_tph_typical": 25_000,
    },
}

# East Coast Indian ports relevant to SAIL coal imports, with rough max
# vessel class each can currently berth (fixed / rarely-updating data —
# your teammate's DB table should be the source of truth; this is a
# fallback/seed so the API works before that table is populated).
EAST_COAST_PORTS = {
    "Paradip": {"country": "India", "max_vessel_class": VesselClass.CAPESIZE, "num_berths": 3},
    "Vizag": {"country": "India", "max_vessel_class": VesselClass.CAPESIZE, "num_berths": 4},
    "Gangavaram": {"country": "India", "max_vessel_class": VesselClass.CAPESIZE, "num_berths": 2},
    "Gopalpur": {"country": "India", "max_vessel_class": VesselClass.PANAMAX, "num_berths": 1},
    "Dhamra": {"country": "India", "max_vessel_class": VesselClass.CAPESIZE, "num_berths": 2},
    "Sagar-Sandheads": {"country": "India", "max_vessel_class": VesselClass.PANAMAX, "num_berths": 1},
    "Haldia": {"country": "India", "max_vessel_class": VesselClass.SUPRAMAX, "num_berths": 2},
}

# TODO: only 5 of the 7 origin countries mentioned in the project summary are
# confirmed. Add the remaining 2 here once known — this list drives request
# validation, ingestion, and the vessel/route recommendation logic, so an
# incomplete list means those 2 countries' data can't be modeled at all yet.
ORIGIN_COUNTRIES = ["Australia", "USA", "Mozambique", "Russia", "Indonesia"]

RISK_TIERS = ["low", "medium", "high"]

BDI_SUB_INDICES = ["BCI", "BPI", "BSI", "BHSI"]  # Capesize/Panamax/Supramax/Handysize sub-indices

VESSEL_CLASS_ORDER = [
    VesselClass.HANDYSIZE,
    VesselClass.GEARED,
    VesselClass.SUPRAMAX,
    VesselClass.PANAMAX,
    VesselClass.CAPESIZE,
]

# Rough origin-port -> East Coast port lanes, for the Port Map nav item.
# lat/lon are approximate port coordinates; distance/transit are typical
# bulk-carrier figures (industry rules of thumb, not live AIS data) — good
# enough to plot a map and label routes, not for precise ETAs.
ORIGIN_PORT_COORDS = {
    "Australia": {"port": "Newcastle", "lat": -32.93, "lon": 151.78},
    "USA": {"port": "Norfolk", "lat": 36.85, "lon": -76.30},
    "Mozambique": {"port": "Beira", "lat": -19.84, "lon": 34.84},
    "Russia": {"port": "Vostochny", "lat": 42.75, "lon": 133.08},
    "Indonesia": {"port": "Samarinda", "lat": -0.50, "lon": 117.15},
}

EAST_COAST_PORT_COORDS = {
    "Paradip": {"lat": 20.31, "lon": 86.61},
    "Vizag": {"lat": 17.68, "lon": 83.22},
    "Gangavaram": {"lat": 17.62, "lon": 83.24},
    "Gopalpur": {"lat": 19.26, "lon": 84.90},
    "Dhamra": {"lat": 20.79, "lon": 86.98},
    "Sagar-Sandheads": {"lat": 21.65, "lon": 88.05},
    "Haldia": {"lat": 22.03, "lon": 88.11},
}