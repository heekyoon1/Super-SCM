# Python Forecast Service

FastAPI 기반의 별도 Forecast Service입니다. 학습 데이터는 Supabase `core.v_train_demand`에서만 조회하며, 결과는 STEP 6의 `core.forecast_run`, `core.model_version`, `core.forecast_result`에 저장합니다.

## 실행

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

필수 환경변수:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (서버 전용, 브라우저에 노출하지 않음)
- `FORECAST_SERVICE_TOKEN` (선택: Next.js proxy 인증)

Endpoints:

- `GET /health`
- `GET /models`
- `POST /forecast/run`
- `POST /backtest/run`
