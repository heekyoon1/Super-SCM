# Supabase 연결 기반 설계

## 목표

현재 로컬 목업 화면을 변경하지 않고, 이후 Supabase PostgreSQL·Auth·Storage 기능을 안전하게 연결할 수 있는 최소 기반을 구성한다.

## 범위

포함:

- `@supabase/supabase-js` 의존성 추가
- Supabase URL과 publishable/anon key를 환경변수로 주입
- 브라우저용 Supabase 클라이언트 모듈 추가
- 서버 컴포넌트·Route Handler에서 사용할 서버용 클라이언트 모듈 추가
- `.env.example` 및 연결 설정 문서 추가
- 환경변수 누락 시 명확한 오류 메시지 제공

제외:

- 데이터베이스 테이블·마이그레이션·RLS 정책
- 로그인/Auth 플로우
- Storage 버킷과 파일 업로드
- 기존 목업 데이터를 Supabase로 이전
- 화면의 실제 CRUD 전환

## 구조

Next.js App Router 기준으로 클라이언트와 서버 모듈을 분리한다.

- `lib/supabase/client.ts`: 브라우저에서 사용하는 `createBrowserClient` 래퍼
- `lib/supabase/server.ts`: 서버 실행 환경에서 사용하는 클라이언트 생성 함수
- `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 예시
- `.env.local`: 실제 사용자가 로컬에서 직접 생성하며 Git에 커밋하지 않음

현재 화면에서는 클라이언트를 호출하지 않는다. 따라서 설정 추가만으로 기존 UI 동작이나 렌더링 결과가 바뀌지 않는다.

## 보안

- 브라우저에 노출 가능한 Supabase URL과 anon/publishable key만 `NEXT_PUBLIC_` 변수로 사용한다.
- service role key는 어떤 클라이언트·저장소·문서에도 넣지 않는다.
- `.env*` 파일의 실제 비밀값은 Git에 추가하지 않는다.
- 실제 데이터 접근을 시작하는 후속 작업에서 RLS를 먼저 설계한다.

## 오류 처리

필수 환경변수가 없을 때 클라이언트 생성 함수가 변수명을 포함한 설명 가능한 오류를 발생시킨다. 단, 현재 화면은 클라이언트를 호출하지 않으므로 환경변수가 없는 상태에서도 기존 목업 화면은 실행 가능하다.

## 검증 기준

- `package.json`과 lockfile에 Supabase 의존성이 기록된다.
- TypeScript 타입 검사 또는 Next.js 빌드가 통과한다.
- 실제 키 없이도 기존 페이지가 렌더링된다.
- `.env.example`만 추적되고 실제 `.env.local` 값은 추적되지 않는다.
- 서버용 모듈이 service role key를 참조하지 않는다.
