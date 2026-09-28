"""Small shared validation helpers used across ingestion/routers."""

from app.constants import ORIGIN_COUNTRIES, RISK_TIERS


def is_known_origin_country(country: str) -> bool:
    return country in ORIGIN_COUNTRIES


def is_valid_risk_tier(tier: str) -> bool:
    return tier in RISK_TIERS
