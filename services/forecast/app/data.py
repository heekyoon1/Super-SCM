from __future__ import annotations

import pandas as pd


def train_grid(rows: list[dict], train_start: str, train_end: str) -> pd.DataFrame:
    """Build a monthly grid; only absent source periods become zero, source NULL stays NULL."""
    source = pd.DataFrame(rows)
    if source.empty:
        return pd.DataFrame(columns=["item_id", "period", "quantity"])
    source["usage_date"] = pd.to_datetime(source["usage_date"])
    source["period"] = source["usage_date"].dt.to_period("M").dt.to_timestamp()
    source["quantity"] = pd.to_numeric(source["quantity"], errors="coerce")
    grouped = source.groupby(["item_id", "period"], as_index=False)["quantity"].sum(min_count=1)
    grouped["has_source"] = True
    items = sorted(source["item_id"].dropna().astype(str).unique())
    periods = pd.date_range(pd.Timestamp(train_start).to_period("M").to_timestamp(), pd.Timestamp(train_end).to_period("M").to_timestamp(), freq="MS")
    grid = pd.MultiIndex.from_product([items, periods], names=["item_id", "period"]).to_frame(index=False)
    result = grid.merge(grouped, on=["item_id", "period"], how="left")
    result["quantity"] = result["quantity"].where(result["has_source"].astype("boolean").fillna(False), 0)
    result = result.drop(columns=["has_source"])
    return result
