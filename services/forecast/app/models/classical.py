from __future__ import annotations

import numpy as np
import pandas as pd

from .interface import ForecastModel, ModelUnavailableError, empty_forecast, interval_frame


def _series(train_df: pd.DataFrame) -> tuple[pd.Series, pd.DatetimeIndex]:
    frame = train_df.sort_values("period").copy()
    periods = pd.to_datetime(frame["period"])
    values = pd.to_numeric(frame["quantity"], errors="coerce")
    return values, periods


def _residual_sigma(values: pd.Series, fitted: list[float | None]) -> float | None:
    residuals = [float(actual - predicted) for actual, predicted in zip(values, fitted) if pd.notna(actual) and predicted is not None]
    return float(np.std(residuals, ddof=1)) if len(residuals) >= 2 else None


class ExponentialSmoothingModel(ForecastModel):
    model_id = "PY_EXP_SMOOTHING"
    def forecast(self, train_df, horizon, params):
        values, _ = _series(train_df)
        alpha = float(params.get("alpha", 0.3))
        valid = values.dropna()
        if valid.empty:
            return empty_forecast(pd.Timestamp(train_df["period"].max()) + pd.offsets.MonthBegin(1), horizon, "NO_TRAIN_VALUES", self.model_id)
        level = float(valid.iloc[0]); fitted = [None]
        for value in valid.iloc[1:]:
            fitted.append(level)
            level = alpha * float(value) + (1 - alpha) * level
        sigma = _residual_sigma(valid, fitted)
        periods = pd.date_range(pd.Timestamp(train_df["period"].max()) + pd.offsets.MonthBegin(1), periods=horizon, freq="MS").date
        return interval_frame(periods, [level] * horizon, sigma, self.model_id)


class HoltModel(ForecastModel):
    model_id = "PY_HOLT"
    def forecast(self, train_df, horizon, params):
        values, _ = _series(train_df); valid = values.dropna()
        if len(valid) < 2:
            return empty_forecast(pd.Timestamp(train_df["period"].max()) + pd.offsets.MonthBegin(1), horizon, "INSUFFICIENT_TRAIN_PERIODS", self.model_id)
        alpha = float(params.get("alpha", 0.3)); beta = float(params.get("beta", 0.1)); level = float(valid.iloc[0]); trend = float(valid.iloc[1] - valid.iloc[0]); fitted = [None]
        for value in valid.iloc[1:]:
            previous_level = level; fitted.append(level + trend); level = alpha * float(value) + (1 - alpha) * (level + trend); trend = beta * (level - previous_level) + (1 - beta) * trend
        points = [level + (step + 1) * trend for step in range(horizon)]
        periods = pd.date_range(pd.Timestamp(train_df["period"].max()) + pd.offsets.MonthBegin(1), periods=horizon, freq="MS").date
        return interval_frame(periods, points, _residual_sigma(valid, fitted), self.model_id)


class HoltWintersModel(ForecastModel):
    model_id = "PY_HOLT_WINTERS"
    def forecast(self, train_df, horizon, params):
        season = int(params.get("season_length", 12)); values, _ = _series(train_df); valid = values.dropna()
        if len(valid) < season * 2:
            return empty_forecast(pd.Timestamp(train_df["period"].max()) + pd.offsets.MonthBegin(1), horizon, "INSUFFICIENT_SEASONAL_PERIODS", self.model_id)
        seasonal = valid.groupby(valid.index % season).mean() if not valid.empty else pd.Series(dtype=float)
        level = float(valid.iloc[-season:].mean()); points = [level + float(seasonal.iloc[step % season] - seasonal.mean()) for step in range(horizon)]
        periods = pd.date_range(pd.Timestamp(train_df["period"].max()) + pd.offsets.MonthBegin(1), periods=horizon, freq="MS").date
        return interval_frame(periods, points, None, self.model_id, "SIGMA_UNAVAILABLE")


class OptionalStatsModel(ForecastModel):
    package_name: str = ""
    def forecast(self, train_df, horizon, params):
        try:
            __import__(self.package_name)
        except ImportError as exc:
            raise ModelUnavailableError(f"OPTIONAL_DEPENDENCY_MISSING:{self.package_name}") from exc
        raise ModelUnavailableError(f"MODEL_ADAPTER_NOT_CONFIGURED:{self.model_id}")


class SarimaModel(OptionalStatsModel):
    model_id = "PY_SARIMA"; package_name = "statsmodels"


class ProphetModel(OptionalStatsModel):
    model_id = "PY_PROPHET"; package_name = "prophet"


class XGBoostModel(OptionalStatsModel):
    model_id = "PY_XGBOOST"; package_name = "xgboost"


class LightGBMModel(OptionalStatsModel):
    model_id = "PY_LIGHTGBM"; package_name = "lightgbm"
