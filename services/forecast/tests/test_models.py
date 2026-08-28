import pandas as pd

from app.data import train_grid
from app.models.intermittent import CrostonModel, SbaModel, TsbModel
from app.models.classical import HoltModel, ExponentialSmoothingModel


def frame(values):
    return pd.DataFrame({"period": pd.date_range("2024-01-01", periods=len(values), freq="MS"), "quantity": values})


def test_common_interface_returns_horizon():
    result = ExponentialSmoothingModel().forecast(frame([10, 12, 11]), 2, {"alpha": 0.3})
    assert len(result) == 2 and {"p50", "p80", "p90", "sigma"}.issubset(result.columns)


def test_intermittent_models_have_no_fake_zero_for_no_demand():
    result = CrostonModel().forecast(frame([0, 0, 0]), 2, {})
    assert result["predicted_qty"].isna().all() and result["calculation_reason"].iloc[0] == "NO_NONZERO_DEMAND"


def test_grid_distinguishes_absent_period_from_source_null():
    rows = [{"item_id": "A", "usage_date": "2024-01-03", "quantity": None}]
    grid = train_grid(rows, "2024-01-01", "2024-02-01")
    assert pd.isna(grid.loc[0, "quantity"]) and grid.loc[1, "quantity"] == 0


def test_croston_family_implements_interface():
    for model in (CrostonModel(), SbaModel(), TsbModel(), HoltModel()):
        assert len(model.forecast(frame([0, 4, 0, 5]), 1, {})) == 1
