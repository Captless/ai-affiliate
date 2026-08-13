"""Balance checking for WaveSpeed API keys."""

from backend.services import wavespeed_service


def fetch_balance(api_key: str) -> float:
    return wavespeed_service.check_balance(api_key)
