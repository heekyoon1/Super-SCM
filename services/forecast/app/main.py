from __future__ import annotations

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from .repository import SupabaseRepository
from .service import run_forecast

app = FastAPI(title="SCM Python Forecast Service", version="1.0.0")


def authorized(token: str | None) -> None:
    expected = __import__("os").environ.get("FORECAST_SERVICE_TOKEN")
    if expected and token != expected:
        raise HTTPException(status_code=401, detail="INVALID_SERVICE_TOKEN")


class ForecastRequest(BaseModel):
    note: str | None = None


class BacktestRequest(BaseModel):
    forecast_run_id: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "python-forecast", "version": app.version}


@app.get("/models")
def models(x_service_token: str | None = Header(default=None)):
    authorized(x_service_token)
    try: return {"models": SupabaseRepository().models()}
    except Exception as exc: raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/forecast/run")
def forecast_run(_: ForecastRequest | None = None, x_service_token: str | None = Header(default=None)):
    authorized(x_service_token)
    try: return {"run_id": run_forecast(SupabaseRepository())}
    except Exception as exc: raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/backtest/run")
def backtest_run(request: BacktestRequest, x_service_token: str | None = Header(default=None)):
    authorized(x_service_token)
    try: return {"backtest_run_id": SupabaseRepository().rpc("run_backtest", {"p_forecast_run_id": request.forecast_run_id})}
    except Exception as exc: raise HTTPException(status_code=500, detail=str(exc)) from exc
