# 검증 중 발견·수정한 결함

## 2026-09-04: `lib/scm.ts` 정적 Supabase import

- 재현 조건: Agent Tool이 `lib/scm.ts`를 dynamic import하는 경로에서 Node test 모듈 로딩 경계를 확인한다.
- 원인: `lib/scm.ts` 파일 상단에서 `createSupabaseServerClient`를 정적으로 import하고 있었다.
- 영향: Agent Tool 계약인 실행 시점 import를 위반하며, Supabase/Next 서버 전용 모듈이 Agent 관련 모듈 로딩 시점에 평가될 수 있었다.
- 수정: `readRows()` 실행 함수 내부에서 `await import('@/lib/supabase/server')`하도록 이동했다.
- 회귀 테스트: `scmIsLoadedLazilyContractTest()`를 `lib/agent/tools.test.ts`에 추가했다.

## 2026-09-10: 계약 테스트가 실제 실행되지 않음

- 재현 조건: 기존 `npm test`를 실행한다.
- 원인: script가 `tsc --noEmit`만 수행하여 `*.test.ts`의 assertion이 실행되지 않았다.
- 영향: Agent의 LLM fallback, 숫자 guardrail 등 런타임 결함이 배포 전 통과로 보일 수 있었다.
- 수정: `tsx` 기반 Node test runner와 `lib/contracts.test.ts`를 추가하고, 타입 검사는 `npm run typecheck`으로 분리했다.

## 2026-09-10: Agent fallback/숫자 검증 회귀

- 재현 조건: 같은 `baseUrl|model`에서 JSON Schema fallback 후 temperature fallback을 실행하거나, 답변에 `1. 항목` 목록 번호를 포함한다.
- 원인: fallback cache가 서로 다른 두 기능을 하나의 상태로 관리했고, guardrail이 문장 중 목록 번호를 숫자로 판단했다.
- 수정: fallback cache를 JSON Schema/temperature별로 분리하고, 문장·쉼표 뒤 목록 번호를 제외했다.
