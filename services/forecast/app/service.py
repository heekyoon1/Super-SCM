from __future__ import annotations

from datetime import datetime, timezone
import pandas as pd

from .data import train_grid
from .models.registry import get_model
from .repository import SupabaseRepository, new_run_id


def run_forecast(repo: SupabaseRepository) -> str:
    settings = repo.settings(); run_id = new_run_id(); started = datetime.now(timezone.utc)
    rows = repo.train_rows(); models = repo.models()
    snapshot = max((row.get("loaded_at") for row in rows if row.get("loaded_at")), default=started.isoformat())
    repo.start_run({"run_id": run_id, "status": "RUNNING", "granularity": settings["granularity"], "train_start": settings["train_start"], "train_end": settings["train_end"], "horizon": settings["forecast_horizon"], "data_snapshot_at": snapshot, "started_at": started.isoformat(), "triggered_by": None, "triggered_email": "python-forecast-service"})
    try:
        grid = train_grid(rows, settings["train_start"], settings["train_end"]); result_rows = []; snapshots = []
        for model in models:
            model_id = model["model_id"]; implementation = get_model(model_id)
            snapshots.append({"run_id": run_id, "model_id": model_id, "version": model["version"], "parameters": model["parameters"], "definition": {"model_name": model["model_name"], "family": model["family"], "engine": "PYTHON", "description": model.get("description")}})
            for item_id, item_frame in grid.groupby("item_id"):
                forecast = implementation.forecast(item_frame[["period", "quantity"]], int(settings["forecast_horizon"]), model["parameters"])
                for record in forecast.to_dict("records"):
                    result_rows.append({"run_id": run_id, "model_id": model_id, "item_id": item_id, "period": str(record["period"]), "model_version": model["version"], "predicted_qty": record["predicted_qty"], "p50": record["p50"], "p80": record["p80"], "p90": record["p90"], "sigma": record["sigma"], "basis": record["basis"], "calculation_reason": record["calculation_reason"]})
        repo.snapshot_models(snapshots); repo.insert_results(result_rows)
        finished = datetime.now(timezone.utc); repo.finish_run(run_id, {"status": "SUCCESS", "models": [model["model_id"] for model in models], "n_models": len(models), "n_items": int(grid["item_id"].nunique()), "n_rows": len(result_rows), "finished_at": finished.isoformat(), "duration_ms": int((finished - started).total_seconds() * 1000), "message": "Python forecast completed"})
        return run_id
    except Exception as exc:
        repo.finish_run(run_id, {"status": "FAILED", "finished_at": datetime.now(timezone.utc).isoformat(), "message": str(exc)})
        raise
