# SuperSCM 데이터 스키마 기준

이 문서는 `supabase/migrations/20260828000000_step2_auth_rbac.sql`부터 `20260904000000_step11_agent_conversation.sql`까지의 현재 DB 계약을 요약한다. 실제 컬럼 변경은 migration을 기준으로 하며, 문서만 수정해서 DB 구조를 바꾸지 않는다.

## 계층과 데이터 흐름

```text
raw 입력
  → core 정책/격리/실행 결과
  → analytics 조회용 view
  → Next.js 화면·Agent Tool
```

학습/검증 흐름은 다음과 같이 분리한다.

```text
raw.usage_history → core.v_train_demand → Forecast / Demand Profile
raw.usage_history → core.v_test_actual  → Backtest scoring
```

`raw.usage_history`의 원본을 Forecast나 Demand Profile이 직접 조회하지 않는다. test Actual은 학습 통계·모델 파라미터에 사용하지 않는다.

## 스키마 목록

### `core`

| 객체 | 목적 |
|---|---|
| `app_user` | `auth.users`와 연결된 사용자, email/name/department, `ADMIN`·`USER`, active, login 시각 |
| `audit_log` | actor, action, target type/id, before/after JSON, at을 보관 |
| `policy_config` | review period, safety buffer days 등 운영 정책 |
| `outlier_rule` | 프로젝트 수요, 반품, 중복, 학습 제외 조건 |
| `item_policy` | item_id, MOQ, pack_size, item_grade, service_level |
| `forecast_setting` | train/test 시작·종료, granularity, champion metric/reference 설정 |
| `upload_batch` | 파일 Import 이력과 행별 결과 |
| `import_staging` | 사용자 승인 전 원본/매핑/검증 staging |
| `column_mapping` | 파일 컬럼과 표준 컬럼의 재사용 매핑 |
| `validation_error` | batch/행/필드 단위 ERROR·WARNING |
| `forecast_run` | Forecast 실행 상태, model snapshot, data snapshot, stale 상태 |
| `model_config` | 모델 정의, 적용 가능한 Demand Type, 기준 모델 설정 |
| `model_version` | 모델 버전과 파라미터 |
| `forecast_result` | run_id, model_id/version, item_id, period, predicted_qty, p50/p80/p90 |
| `backtest_run` | Forecast 실행과 분리된 검증 실행 이력 |
| `model_performance` | WAPE, MAPE, Bias, RMSE, MAE, 개선율, rank, reason/status |
| `champion_model` | SKU별 AUTO/MANUAL Champion과 후보 성능·선정 근거 |
| `champion_selection_issue` | Champion 후보 부족/계산 불가 이슈 |
| `service_level_policy` | item grade별 service level 및 z-value |
| `lead_time_policy` | 관리자 확정값, P50/P80/P90, effective lead time |
| `lead_time_policy_history` | Lead Time 변경 이력과 변경자 |
| `inventory_projection_setting` | Projection horizon 및 risk 경계 정책 |
| `agent_conversation` | 사용자별 Agent 대화 제목·시작·최근 시각 |
| `agent_message` | user/assistant/tool/system 메시지와 answer/tool trace/usage/guardrail JSON |
| `save_agent_turn(...)` | 질문과 답변을 한 transaction으로 저장하는 security definer RPC |

### `raw`

주요 입력 테이블은 `usage_history`, `business_event`, `sales_order`, `item_substitute`, `inventory_snapshot`, `purchase_order`, `soft_allocation`, `lead_time_observation`이다. 가능한 raw 입력에는 다음 적재 추적 필드가 사용된다.

- `batch_id`
- `source_type`
- `loaded_at`
- `source_record_id`

STEP 4 Import은 CSV/XLSX를 staging에서 parse·mapping·validation한 뒤 승인된 행만 RAW에 저장한다. `append`, `upsert`, `replace`는 분리하며 replace는 사용자 확인과 rollback 제한을 표시한다.

### `analytics` 주요 view

| View | 목적 |
|---|---|
| `v_data_coverage` | 전체/train/test 기간, 행 수와 window 정상 여부 |
| `v_sku_demand_profile` | 학습기간 SKU별 ADI, CV², zero-demand, trend, peak, type, seasonality, reason |
| `v_demand_profile_kpi` | SMOOTH/INTERMITTENT/ERRATIC/LUMPY 및 계산 불가 KPI |
| `v_forecast_run`, `v_forecast_result`, `v_model_config` | Forecast 실행·결과 조회 |
| `v_backtest_run`, `v_model_performance`, `v_champion_model`, `v_champion_history` | Backtest 및 Champion 조회 |
| `v_model_comparison` | 검증 Actual과 저장 Forecast의 모델 비교 |
| `v_lead_time_policy` | 실적 P50/P80/P90, 관리자 확정값, Effective Lead Time |
| `v_inventory_projection`, `v_stockout_risk` | Forecast 기반 기간별 재고와 위험 상태 |
| `v_safety_stock`, `purchase_recommendation` | Safety Stock·MOQ·Pack Size 기반 발주 추천 |

실데이터 조회용 추가 view는 `v_shipment_by_hoc`, `v_option_commonality`, `v_shipment_trend`, `v_item_demand_profile`, `v_ol_accuracy`, `v_bom_requirement_x` 계약을 따른다. 애플리케이션에서는 화면과 Agent가 `lib/scm.ts`의 함수를 통해 접근한다.

## 핵심 계산 계약

### Demand Profile

- 기간 grid는 SKU × 학습기간 전체 period로 만든다.
- 기간상 기록 부재의 0과 원본 NULL은 의미를 구분한다.
- `ADI = 전체 기간 수 / quantity > 0 기간 수`.
- 발생 기간 quantity의 `CV = standard deviation / mean`, `CV² = CV × CV`.
- `ADI < 1.32`, `CV² < 0.49`이면 `SMOOTH`; 각각 기준을 넘으면 `INTERMITTENT`, `ERRATIC`, `LUMPY` 규칙을 적용한다.
- 발생 기간이 없거나 평균·표본이 부족하면 NULL과 reason code를 반환한다.
- seasonality는 24개월 미만이면 `NULL + INSUFFICIENT_PERIODS`이며 false로 바꾸지 않는다.

### Forecast/Backtest

Forecast 결과는 `run_id`와 `model_version`을 보존한다. Backtest는 저장된 `forecast_result`와 `core.v_test_actual`을 비교한다.

- WAPE: `SUM(ABS(forecast - actual)) / SUM(actual)`
- MAPE: actual=0 기간을 0%로 바꾸지 않고 정책에 따라 제외/계산 불가 처리
- Bias: `SUM(forecast - actual) / SUM(actual)`; 양수는 과대예측
- RMSE/MAE: SQL 계산
- Champion은 설정된 `champion_metric` 기준 유효 성능 중 최상위를 AUTO 선정
- 동률은 metric → absolute Bias → RMSE 순으로 해소하고, 후보 전체를 저장한다.

### Inventory / Purchase

Projection은 beginning inventory에서 scheduled receipt, confirmed sales order, soft allocation, champion forecast를 기간별 반영한다. 재고·Forecast·Lead Time이 없으면 임의 0/기본일수/날짜를 만들지 않는다.

Effective Lead Time 우선순위:

```text
관리자 확정값 → 실적 P80 → 계산 불가
```

Safety Stock 기본식:

```text
sigma_DLT = sqrt(L * sigma_d^2 + d^2 * sigma_L^2)
Safety Stock = Z * sigma_DLT
```

여기서 `L`은 Effective Lead Time, `sigma_d`는 Backtest Forecast error variability, `d`는 기대수요, `sigma_L`은 실적 Lead Time variability, `Z`는 DB의 service-level policy에서 가져온다. 추천수량은 Forecast와 확정수주의 PRD 우선순위를 적용하고, 양수 필요량에 MOQ를 적용한 뒤 Pack Size 배수로 올림한다. 계산 불가와 정상적인 `required_qty <= 0 → recommended_qty=0`은 구분한다.

## Agent 데이터 계약

### Tool 4종

`lib/agent/tools.ts`는 다음 네 Tool만 제공한다.

1. `getShipmentTrend(itemCode)`: `analytics.v_shipment_by_hoc` 기반 월별 출고와 3M/6M/12M 평균
2. `getDemandProfile(itemCode)`: 학습기간 수요 특성. 6개월 미만은 `INSUFFICIENT_HISTORY`
3. `getOlAccuracy(modelBase, fy?)`: `fact_mc_plan_actual`에서 Sales OL/SCM OL WAPE와 Bias. act NULL 행 제외, 분모 0은 NULL+reason
4. `getBomRequirement(modelBase)`: `bridge_mc_cap → bridge_cap_option → bridge_bom`, MUST_OPTION, SCC/Label, 수량과 common 여부

Tool은 `roles`로 USER/ADMIN 접근을 제한하고, 실행 시 조회 결과의 수치·기준시각·reason을 반환한다. Agent가 DB를 직접 읽지 않는다.

### Structured Answer

Agent 최종 응답은 strict JSON Schema의 `AgentAnswer`다. 모든 object는 `additionalProperties:false`, 모든 property는 required이며 선택값은 null union이다. 필수 필드는 `answer`, `verdict`, `evidence`, `data_as_of`, `risk`, `recommended_action`, `cannot_answer`, `cannot_answer_reason`이다.

대화 저장은 `core.save_agent_turn`에서 question/assistant answer를 원자적으로 저장한다. 저장 실패는 사용자에게 표시하되 Agent 답변은 보존한다.

## RLS 원칙

- `anon`: 업무 데이터 select/write 차단
- authenticated USER: 허용된 업무 조회
- ADMIN: 정책·설정 mutation 및 관리자 기능
- Agent conversation/message: owner select/insert, ADMIN 전체 select, 교차 사용자 접근 차단
- analytics view의 실제 접근은 underlying core/raw 권한과 view 정책을 함께 확인한다.

## 적용·검증

Migration은 파일명 timestamp 순서대로 적용한다.

```bash
supabase db push
```

적용 전에는 `supabase migration list`와 대상 객체 존재 여부를 확인하고, 적용 후에는 테이블/컬럼/정책/RPC와 대표 조회를 확인한다. 인증된 사용자 A/B와 ADMIN 세션으로 교차 대화 조회, 정책 변경, 계산 불가 값을 검증한다.
