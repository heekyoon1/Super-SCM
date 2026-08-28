from __future__ import annotations

from abc import ABC, abstractmethod
import pandas as pd


class ModelUnavailableError(RuntimeError):
    pass


class ForecastModel(ABC):
    model_id: str
    default_version: str = "1.0.0"

    @abstractmethod
    def forecast(self, train_df: pd.DataFrame, horizon: int, params: dict) -> pd.DataFrame:
        """Return period, predicted_qty, p50, p80, p90, sigma, basis, calculation_reason."""
        raise NotImplementedError


def empty_forecast(start: pd.Timestamp, horizon: int, reason: str, basis: str) -> pd.DataFrame:
    periods = pd.date_range(start=start, periods=horizon, freq="MS")
    return pd.DataFrame({
        "period": periods.date,
        "predicted_qty": [None] * horizon,
        "p50": [None] * horizon,
        "p80": [None] * horizon,
        "p90": [None] * horizon,
        "sigma": [None] * horizon,
        "basis": [basis] * horizon,
        "calculation_reason": [reason] * horizon,
    })


def interval_frame(periods, points, sigma, basis, reason=None) -> pd.DataFrame:
    sigma_value = float(sigma) if sigma is not None and pd.notna(sigma) else None
    point_values = [float(value) if value is not None and pd.notna(value) else None for value in points]
    return pd.DataFrame({
        "period": periods,
        "predicted_qty": point_values,
        "p50": point_values,
        "p80": [value + 0.8416212336 * sigma_value if value is not None and sigma_value is not None else None for value in point_values],
        "p90": [value + 1.2815515655 * sigma_value if value is not None and sigma_value is not None else None for value in point_values],
        "sigma": [sigma_value] * len(point_values),
        "basis": [basis] * len(point_values),
        "calculation_reason": [reason if reason else (None if sigma_value is not None else "SIGMA_UNAVAILABLE")] * len(point_values),
    })
