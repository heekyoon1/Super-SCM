from __future__ import annotations

import os
from typing import Any
from uuid import UUID, uuid4
import httpx


class SupabaseRepository:
    def __init__(self) -> None:
        self.base = os.environ.get("SUPABASE_URL", "").rstrip("/")
        self.key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        if not self.base or not self.key:
            raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY_REQUIRED")
        self.headers = {"apikey": self.key, "Authorization": f"Bearer {self.key}", "Content-Type": "application/json", "Prefer": "return=representation"}

    def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        with httpx.Client(base_url=f"{self.base}/rest/v1", headers=self.headers, timeout=60) as client:
            response = client.request(method, path, **kwargs)
            response.raise_for_status()
            return response.json() if response.content else None

    def _schema_headers(self, schema: str) -> dict[str, str]:
        return {**self.headers, "Accept-Profile": schema, "Content-Profile": schema}

    def select(self, table: str, params: dict[str, str], schema: str = "core") -> list[dict]:
        original = self.headers; self.headers = self._schema_headers(schema)
        try: return self._request("GET", f"/{table}", params=params) or []
        finally: self.headers = original

    def insert(self, table: str, payload: Any, schema: str = "core") -> Any:
        original = self.headers; self.headers = self._schema_headers(schema)
        try: return self._request("POST", f"/{table}", json=payload)
        finally: self.headers = original

    def update(self, table: str, filters: dict[str, str], payload: dict, schema: str = "core") -> Any:
        original = self.headers; self.headers = self._schema_headers(schema)
        try: return self._request("PATCH", f"/{table}", params=filters, json=payload)
        finally: self.headers = original

    def rpc(self, name: str, payload: dict, schema: str = "core") -> Any:
        original = self.headers; self.headers = self._schema_headers(schema)
        try: return self._request("POST", f"/rpc/{name}", json=payload)
        finally: self.headers = original

    def train_rows(self) -> list[dict]:
        return self.select("v_train_demand", {"select": "item_id,usage_date,quantity,loaded_at", "order": "item_id,usage_date"})

    def settings(self) -> dict:
        rows = self.select("forecast_setting", {"select": "*", "setting_key": "eq.default", "active": "eq.true", "limit": "1"})
        if not rows:
            raise RuntimeError("FORECAST_SETTING_NOT_FOUND")
        return rows[0]

    def models(self) -> list[dict]:
        return self.select("model_config", {"select": "*", "engine": "eq.PYTHON", "enabled": "eq.true"})

    def start_run(self, payload: dict) -> None:
        self.insert("forecast_run", payload)

    def finish_run(self, run_id: str, payload: dict) -> None:
        self.update("forecast_run", {"run_id": f"eq.{run_id}"}, payload)

    def snapshot_models(self, payload: list[dict]) -> None:
        if payload:
            self.insert("model_version", payload)

    def insert_results(self, payload: list[dict]) -> None:
        for offset in range(0, len(payload), 500):
            self.insert("forecast_result", payload[offset:offset + 500])


def new_run_id() -> str:
    return str(uuid4())
