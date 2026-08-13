# 기기·옵션 월간 발주계획 MVP

PRD 기준 1단계 로컬 웹 프로토타입입니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 현재 단계

현재는 전체 업무 흐름을 확인하기 위한 Phase 1 화면입니다.

```text
전체 현황
→ 수요 확정
→ 재고·공급
→ 마스터 검증
→ 발주량 계산
→ 보고자료
```

화면에는 업무 단계, 입력 항목, 계산 결과 구조, 예외 검토, 보고자료 미리보기를 대표 샘플값으로 표시합니다.

## 다음 구현 단계

- SQLite 저장 및 발주계획 생성/조회
- 화면 직접 입력 및 Excel/CSV 업로드
- 실제 발주량 계산 서비스
- 수동 조정 이력
- Excel/PDF 보고서 다운로드

## 참고

샘플 데이터가 제공되면 화면의 대표값을 실제 데이터 구조와 계산 기준에 맞춰 교체합니다.
# Super-SCM

## Supabase 연결 기반 설정

현재 프로젝트는 Supabase 클라이언트 연결 기반만 포함하며, 실제 테이블·로그인·Storage·CRUD는 아직 연결하지 않습니다.

### 로컬 설정

1. `.env.example`을 `.env.local`로 복사합니다.
2. Supabase Dashboard의 Project Settings → API에서 프로젝트 URL과 publishable/anon key를 입력합니다.

```bash
cp .env.example .env.local
```

필수 환경변수:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

브라우저용 클라이언트는 `lib/supabase/client.ts`, 서버용 클라이언트는 `lib/supabase/server.ts`에서 제공합니다.

### Vercel 설정

Vercel Project Settings → Environment Variables에 다음 두 변수를 Development, Preview, Production 환경별로 등록한 뒤 재배포합니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Service role key는 `NEXT_PUBLIC_*` 변수, 브라우저 코드, `.env.example`, Git 저장소에 절대 넣지 마세요.
