from __future__ import annotations

import numpy as np
import pandas as pd

from .classical import _residual_sigma, _series
from .interface import ForecastModel, empty_forecast, interval_frame


class CrostonModel(ForecastModel):
    model_id = "PY_CROSTON"
    def forecast(self, train_df, horizon, params):
        values, _ = _series(train_df); valid = values.fillna(0).to_numpy(dtype=float); alpha = float(params.get("alpha", 0.1)); demand = valid[valid > 0]
        if len(demand) == 0: return empty_forecast(pd.Timestamp(train_df["period"].max()) + pd.offsets.MonthBegin(1), horizon, "NO_NONZERO_DEMAND", self.model_id)
        size = float(demand[0]); interval = float(np.argmax(valid > 0) + 1); elapsed = 0
        for value in valid[1:]:
            elapsed += 1
            if value > 0: size = size + alpha * (value - size); interval = interval + alpha * (elapsed - interval); elapsed = 0
        point = size / interval if interval else None; periods = pd.date_range(pd.Timestamp(train_df["period"].max()) + pd.offsets.MonthBegin(1), periods=horizon, freq="MS").date
        return interval_frame(periods, [point] * horizon, None, self.model_id, "SIGMA_UNAVAILABLE")


class SbaModel(CrostonModel):
    model_id = "PY_SBA"
    def forecast(self, train_df, horizon, params):
        result = super().forecast(train_df, horizon, params)
        if result["predicted_qty"].notna().any(): result.loc[:, ["predicted_qty", "p50"]] *= 1 - float(params.get("alpha", 0.1)) / 2
        return result


class TsbModel(ForecastModel):
    model_id = "PY_TSB"
    def forecast(self, train_df, horizon, params):
        values, _ = _series(train_df); series = values.fillna(0).to_numpy(dtype=float); demand = series[series > 0]
        if len(demand) == 0: return empty_forecast(pd.Timestamp(train_df["period"].max()) + pd.offsets.MonthBegin(1), horizon, "NO_NONZERO_DEMAND", self.model_id)
        alpha = float(params.get("alpha", 0.1)); beta = float(params.get("beta", 0.1)); probability = float(demand.size / max(len(series), 1)); size = float(demand.mean())
        for value in series:
            occurrence = 1.0 if value > 0 else 0.0; probability = probability + beta * (occurrence - probability); size = size + alpha * (value - size) if occurrence else size
        point = probability * size; periods = pd.date_range(pd.Timestamp(train_df["period"].max()) + pd.offsets.MonthBegin(1), periods=horizon, freq="MS").date
        return interval_frame(periods, [point] * horizon, None, self.model_id, "SIGMA_UNAVAILABLE")
