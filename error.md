# 검증 중 발견·수정한 결함

## 2026-09-04: `lib/scm.ts` 정적 Supabase import

- 재현 조건: Agent Tool이 `lib/scm.ts`를 dynamic import하는 경로에서 Node test 모듈 로딩 경계를 확인한다.
- 원인: `lib/scm.ts` 파일 상단에서 `createSupabaseServerClient`를 정적으로 import하고 있었다.
- 영향: Agent Tool 계약인 실행 시점 import를 위반하며, Supabase/Next 서버 전용 모듈이 Agent 관련 모듈 로딩 시점에 평가될 수 있었다.
- 수정: `readRows()` 실행 함수 내부에서 `await import('@/lib/supabase/server')`하도록 이동했다.
- 회귀 테스트: `scmIsLoadedLazilyContractTest()`를 `lib/agent/tools.test.ts`에 추가했다.

현재 추가로 확인된 결함은 없다. 프로젝트의 `npm test` 명령은 테스트 실행기가 아니라 `tsc --noEmit`으로 구성되어 있어, export된 계약 테스트 함수 자체는 별도 Node test runner 설정 없이는 자동 실행되지 않는다.
