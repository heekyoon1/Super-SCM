# SuperSCM Agent 작업 규칙

이 문서는 이 저장소에서 작업하는 개발 에이전트와 사람이 지켜야 할 운영 계약이다. 현재 구현 상태를 기준으로 하며, 요구사항과 실제 migration이 충돌하면 사용자가 명시한 요구사항을 우선하되 migration과 코드의 불일치를 보고한다.

## 작업 전 확인

- `ARCHITECTURE.md`, `Design.md`, `SCHEMA.md`와 관련 migration을 먼저 읽는다.
- 없는 문서를 있다고 가정하거나 생성 전에 읽으려 하지 않는다.
- 변경 범위를 먼저 확인한다. 요청받지 않은 STEP, UI, 계산 로직은 확장하지 않는다.
- 기존 사용자 변경사항과 미커밋 파일을 보존한다. `git reset --hard`, `git checkout --`, 광범위한 삭제를 사용하지 않는다.

## 프로젝트 구조

- `app/`: Next.js App Router 페이지와 route group
- `app/(auth)`: 로그인 등 인증 진입점
- `app/(user)`: 인증된 USER/ADMIN 공통 조회 화면
- `app/(admin)`: `requireAdmin()`이 적용되는 관리자 화면
- `app/(legacy)/workflow`: 이전 하드코딩 workflow 격리 영역
- `components/`: 공통 shell/UI와 화면 컴포넌트
- `lib/`: 인증, Supabase, SCM 조회·정규화, Agent 계약·도구·오케스트레이션
- `supabase/migrations/`: 순서가 있는 PostgreSQL migration
- `services/python-forecast/`: Next.js와 분리된 FastAPI 고급 Forecast 서비스

## 권한과 보안

- 보호된 Server Component, Server Action, Route Handler의 첫 단계에서 `requireUser()` 또는 `requireAdmin()`을 호출한다.
- 메뉴 숨김은 UX일 뿐 보안 수단이 아니다. 권한은 서버와 DB RLS에서 재검증한다.
- `anon`에게 업무 데이터 쓰기 권한을 부여하지 않는다.
- `service_role` 키는 서버 전용이며 `NEXT_PUBLIC_*`나 브라우저 코드에 넣지 않는다.
- `core.app_user.role`과 `active`를 클라이언트 입력값으로 신뢰하지 않는다.
- 자기 자신의 ADMIN 권한 제거와 계정 비활성화는 거부한다.
- 사용자 권한 변경과 운영상 중요한 관리자 변경은 `core.audit_log`에 기록한다.
- Agent conversation은 소유자만 insert/select하고 ADMIN은 전체 select만 할 수 있다. update/delete 정책을 추가할 때는 별도 권한 설계가 필요하다.

## 데이터와 계산 규칙

- DB 계층은 `raw → core → analytics` 흐름을 유지한다. 실데이터 조회는 화면 목업 배열이 아니라 `lib/scm.ts`의 조회 함수를 사용한다.
- `lib/agent` 안에서 Supabase를 직접 조회하거나 SCM 계산을 새로 만들지 않는다. Agent Tool은 `lib/scm.ts` 함수를 감싼다.
- `lib/scm.ts`의 Supabase 호출은 실행 함수 안에서 `await import`하여 Node test의 모듈 로딩을 방해하지 않도록 한다.
- `fact_shipment`는 희소 저장이다. 월별 0이 필요하면 달력과 LEFT JOIN하여 조밀한 기간 grid를 만든다.
- 조인 키는 `item_code`와 `model_base`를 사용한다. 서로 다른 표기의 `model_key`를 조인 키로 만들지 않는다.
- `dim_model.model_base`가 NULL/빈 값인 그룹 행은 기종 분석에서 제외한다.
- 학습 분석은 `core.v_train_demand`, 검증 Actual은 `core.v_test_actual`만 사용한다. Forecast/프로필 코드가 `raw.usage_history`를 직접 읽지 않게 한다.
- 기간, 정책, service level, buffer, champion metric 같은 운영값과 날짜를 TypeScript/SQL에 임의 하드코딩하지 않는다.
- 계산 불가 값은 0, 임의 날짜, 평균, 기본 Lead Time으로 대체하지 않는다. `NULL + reason_code` 또는 `CALCULATION_UNAVAILABLE`을 유지한다.
- 상태 코드는 DB에 영문 코드로 저장한다: `SAFE`, `WARNING`, `CRITICAL`, `CALCULATION_UNAVAILABLE` 및 Demand Type `SMOOTH`, `INTERMITTENT`, `ERRATIC`, `LUMPY`.
- React에서는 ADI, CV/CV², Forecast, Projection, Safety Stock, 발주량을 재계산하지 않는다. 저장된 analytics 결과를 표시한다.

## Agent 계약

- Agent 답변은 `lib/agent/schema.ts`의 `AgentAnswer` 형식을 항상 따른다.
- `answer`, `verdict`, `evidence`, `data_as_of`, `risk`, `recommended_action`, `cannot_answer`, `cannot_answer_reason`은 항상 존재한다.
- Structured Output JSON Schema는 strict이며 모든 object에 `additionalProperties: false`, 모든 property에 `required`를 사용한다. 선택값은 null union으로 표현한다.
- 잘못된 JSON이나 누락 필드는 예외 대신 `cannotAnswer(reason_code)`로 변환한다.
- Tool은 `name`, 한국어 `description`, JSON Schema `parameters`, `roles`, `run`을 제공한다.
- ToolResult는 `ok`, `data`, `numbers`, `dataAsOf`, `reason`을 제공하고 `numbers`에는 반환된 수치를 담는다.
- 도구 실행은 사용자 role을 노출 목록과 실행 직전에 모두 확인한다. 오케스트레이터 loop는 최대 6회, 전체 60초다.
- 숫자 guardrail은 품목코드·기종코드·P80·연월·날짜·목록 번호를 제외하고, 근거의 허용 숫자와 답변 숫자를 대조한다.
- Agent UI는 API key와 Tool 원본 전체 데이터를 브라우저에 노출하지 않는다.
- 대화 저장은 Agent 기능과 분리된 부가 작업이다. 저장 실패가 Agent 답변 자체를 제거하거나 실패로 바꾸지 않도록 한다.

## UI와 스타일

- `Design.md`의 토큰과 공통 컴포넌트를 사용한다. 화면에 hex 색상과 반복 간격을 직접 쓰지 않는다.
- 공통 스타일은 `app/globals.css`, `styles/shell.css`, `styles/components.css`, `styles/chart.css`로 분리한다.
- 공통 UI는 `components/shell`과 `components/ui`를 우선 재사용한다.
- 계산 불가 값은 `EmptyValue`로 `— + reason_code` 형식으로 표시한다.
- 상태는 Badge와 텍스트를 함께 사용하며 색상만으로 의미를 전달하지 않는다.
- 새 CSS framework, Tailwind, styled-components, CSS Modules를 추가하지 않는다.
- 모든 메뉴 정의는 `lib/menu.ts`에서 관리하고 ADMIN/USER 메뉴를 분리한다.

## 검증

변경 후 범위에 맞게 다음을 실행한다.

```bash
npm test
npx tsc --noEmit
npm run build
```

DB 변경은 먼저 migration을 SQL Editor/`supabase db push`로 적용하고, 적용 전후 schema·RLS·대표 쿼리를 확인한다. 두 사용자 권한, ADMIN 권한, 계산 불가 데이터와 rollback/저장 실패 경로를 실제 인증 세션으로 수동 검증해야 한다.

코드 변경을 요청받지 않았다면 migration 적용, Git commit, push를 임의로 하지 않는다.
