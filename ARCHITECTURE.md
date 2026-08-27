# Super-SCM 프로젝트 아키텍처

## 1. 문서 목적

이 문서는 현재 저장소의 실제 코드와 산출물을 기준으로 프로젝트 구조, 폴더별 책임, 파일별 역할, 화면 실행 흐름과 향후 확장 지점을 설명한다.

현재 프로젝트는 기기·옵션 월간 발주계획 업무를 시각화한 Phase 1 로컬 웹 프로토타입이다. 화면은 동작하지만 데이터베이스 저장, 실제 파일 업로드, 외부 시스템 연동, 인증과 권한 관리는 아직 구현되지 않았다.

---

## 2. 전체 구조 요약

### 2.1 폴더별 기능 요약

| 경로 | 기능 요약 | 현재 상태 |
|---|---|---|
| `app/` | Next.js App Router의 진입점, 공통 레이아웃, 전역 스타일 | 구현됨 |
| `components/` | 실제 업무 화면과 화면 전환 로직을 담당하는 React 컴포넌트 | 구현됨. 샘플 데이터 중심 |
| `components/workflow/` | 발주계획 업무 단계별 화면 컴포넌트 | 6단계 화면 구현 |
| `lib/` | 외부 서비스 및 공통 인프라 모듈 | Supabase 클라이언트 골격만 구현 |
| `lib/supabase/` | 브라우저/서버용 Supabase 클라이언트 생성 | 연결 기반만 제공. CRUD 없음 |
| `docs/` | 설계서와 구현 계획 문서 | PRD, 설계, 계획 보관 |
| `docs/superpowers/` | 작업 단위별 사양서와 계획서 | 프로젝트 개발 기록 |
| `outputs/` | 업무 프로세스 정의서와 미리보기 등 생성 산출물 | 바이너리/검증 결과 보관 |
| 루트 스크립트 | 샘플 수요 데이터 및 Excel 업무 정의서 생성 | 수동 실행용 |

### 2.2 파일별 기능 요약

| 파일 | 역할 |
|---|---|
| `app/page.tsx` | `/` 경로에서 `ProcurementApp`을 렌더링하는 최상위 페이지 |
| `app/layout.tsx` | HTML 기본 구조, 한국어 문서 언어, 메타데이터와 전역 CSS 적용 |
| `app/globals.css` | 사이드바, 상단바, 카드, 표, 태그, 반응형 레이아웃 등 전체 UI 스타일 |
| `components/procurement-app.tsx` | 업무 단계 목록, 현재 단계 상태, 네비게이션, 공통 화면 골격을 관리 |
| `components/workflow/dashboard-step.tsx` | 전체 현황 대시보드와 업무 진입 화면 |
| `components/workflow/demand-step.tsx` | OL, SFDC, Bulk-deal, Trend, 수급회의 기반 수요 입력·검증·확정 화면 |
| `components/workflow/supply-step.tsx` | 재고와 Open PO 준비 상태 및 공급망 입력 항목 화면 |
| `components/workflow/master-step.tsx` | 품목, BOM, 장착율, MOQ, Lead Time 등 마스터 준비 상태 화면 |
| `components/workflow/calculation-step.tsx` | 발주량 계산 결과와 Flex/MOQ 등 예외 검토 화면 |
| `components/workflow/report-step.tsx` | 발주금액 비교와 경영진 보고자료 미리보기 화면 |
| `components/workflow/step-frame.tsx` | 업무 단계 하단의 이전/다음 이동 UI를 공통화 |
| `lib/supabase/client.ts` | 브라우저에서 사용할 Supabase 클라이언트 생성 함수 |
| `lib/supabase/server.ts` | 서버 컴포넌트/Route Handler에서 사용할 Supabase 클라이언트 생성 함수 |
| `build_dummy_demand_data.mjs` | 2025년 OL·SFDC·Bulk-deal·Trend·수급회의 샘플 Excel 생성 |
| `build_workbook.mjs` | 업무 프로세스 정의서와 발주계산 템플릿 Excel 생성 |
| `package.json` | 실행 스크립트와 Next.js/React/Supabase 등 의존성 정의 |
| `next.config.ts` | Next.js 설정 및 React Strict Mode 활성화 |
| `tsconfig.json` | TypeScript 컴파일 규칙과 `@/*` 경로 별칭 정의 |
| `vercel.json` | Vercel에서 Next.js 프로젝트로 인식하도록 지정 |
| `.env.example` | Supabase 공개 URL/anon 또는 publishable key 환경변수 예시 |
| `.gitignore` | 의존성, 빌드 결과, 로컬 환경변수, 임시 파일 제외 |
| `README.md` | 실행 방법, 현재 범위, Supabase 환경변수 설정 안내 |
| `2026-08-13-procurement-planning-mvp-prd.md` | 제품 목표, 업무 흐름, 계산 규칙, 데이터 모델을 정의한 PRD |

---

## 3. 시스템 구성

```text
브라우저
  │
  ▼
Next.js App Router
  ├─ app/layout.tsx       공통 HTML/메타데이터/CSS
  └─ app/page.tsx         루트 페이지 진입점
       │
       ▼
  components/procurement-app.tsx
       │  현재 단계(active)와 이동(onNext/onBack) 관리
       ├─ DashboardStep
       ├─ DemandStep       브라우저 로컬 React state로 샘플 수요 편집
       ├─ SupplyStep
       ├─ MasterStep
       ├─ CalculationStep
       └─ ReportStep

향후 연결 지점
  lib/supabase/client.ts  브라우저 Supabase client factory
  lib/supabase/server.ts  서버 Supabase client factory
  ※ 현재 페이지 컴포넌트에서는 아직 호출하지 않음
```

핵심 특징은 서버 API 계층이나 Repository 계층 없이, 페이지에서 업무 컴포넌트를 직접 렌더링하는 단순한 프론트엔드 프로토타입 구조라는 점이다.

---

## 4. 폴더 및 파일 상세

### 4.1 `app/`: Next.js 애플리케이션 진입 계층

#### `app/page.tsx`

루트 URL(`/`)의 페이지 컴포넌트다. 자체 업무 로직은 갖지 않고 `@/components/procurement-app`의 `ProcurementApp`을 렌더링한다. `@/*` 별칭은 `tsconfig.json`에 정의되어 있다.

#### `app/layout.tsx`

모든 페이지를 감싸는 Root Layout이다.

- `lang="ko"`로 문서 언어를 한국어로 설정한다.
- 브라우저 탭 제목과 설명을 `metadata`로 정의한다.
- `app/globals.css`를 전역으로 로드한다.
- `body suppressHydrationWarning`을 사용한다.

현재 라우트가 하나뿐이므로 전역 레이아웃이 사실상 전체 앱 셸의 시작점이다.

#### `app/globals.css`

컴포넌트에 사용되는 공통 시각 체계를 CSS로 정의한다.

- 색상 변수와 기본 박스 모델
- 좌측 사이드바와 상단 헤더
- 진행 단계 표시줄
- 카드, KPI 지표, 표, 입력 폼
- 상태 태그와 알림(Callout)
- 업무 단계 하단 네비게이션
- 데스크톱/태블릿 대응 미디어 쿼리

별도의 CSS Module이나 디자인 시스템 패키지는 사용하지 않으며, 클래스명 기반의 단일 전역 스타일 파일을 사용한다.

### 4.2 `components/`: 화면 표현 및 UI 상태 계층

#### `components/procurement-app.tsx`

전체 업무 화면의 컨테이너이자 클라이언트 상태의 최상위 소유자다. `'use client'` 지시어로 브라우저 컴포넌트로 동작한다.

주요 책임:

- `StepId` 타입으로 6개 업무 단계 식별
- `steps` 배열로 단계 라벨, 순서, 아이콘, 화면용 kicker 정의
- `active` 상태로 현재 단계 관리
- 사이드바와 가로 진행 표시줄 렌더링
- 이전/다음 단계 이동 및 특정 단계 직접 이동
- 현재 단계에 맞는 workflow 컴포넌트 선택

`useMemo`로 현재 단계 화면을 선택하지만, 실제 데이터는 각 단계 컴포넌트가 별도로 관리한다. 따라서 단계 간 업무 데이터 공유나 저장은 아직 없다.

#### `components/workflow/step-frame.tsx`

각 업무 단계에 공통으로 붙는 하단 프레임이다. `children`으로 단계 본문을 받고 `onBack`, `onNext`, `nextLabel`을 통해 이전/다음 버튼을 표시한다.

이 컴포넌트는 업무 로직을 알지 않으며, 화면 간 이동 UI의 중복을 줄이는 레이아웃 컴포넌트 역할을 한다.

#### `components/workflow/dashboard-step.tsx`

전체 현황 화면이다.

- 당월 발주금액, 수요 확정, 발주량 예외, 보고자료 KPI 표시
- 프로세스 준비상태 체크리스트 표시
- 수요 확정 시작 및 보고자료 미리보기 진입
- KPI 카드 클릭으로 관련 단계 이동
- 현재 발주계획 목록을 샘플값으로 표시

`onOpenStep` 콜백으로 부모의 `active` 단계를 변경한다. 데이터 조회나 저장은 하지 않는다.

#### `components/workflow/demand-step.tsx`

현재 프로젝트에서 가장 많은 상호작용을 포함한 수요 확정 화면이다. `'use client'` 컴포넌트이며 입력값을 React state로만 유지한다.

주요 데이터 타입:

- `DemandStatus`: 확정 후보, 조건부, 참고, 제외
- `DemandRow`: OL 행 데이터
- `SfdcRow`: SFDC Pipeline 데이터
- `BulkRow`: Bulk-deal 데이터

주요 기능:

- 대상월도 변경과 월별 OL 샘플 행 재생성
- OL 행 추가 및 입력값 변경
- SFDC 예상수량/수주확률 변경
- Bulk-deal 사전재고 확보 여부와 상태 변경
- 과거 Trend 요약 표시
- 수급회의 일자, 참석부서, 결정사항, 사전재고 확보 여부 입력
- 필수값/수량 검증
- OL + SFDC 확률 가중치 + Bulk 반영률을 이용한 확정수요 미리보기
- 검증 완료 후 수요 확정 상태 표시

계산 방식은 현재 UI 검증용 단순 로직이다.

```text
OL 합계 = 제외 상태가 아닌 OL 수량의 합
SFDC 추가수요 = 예상수량 × 수주확률
Bulk 추가수요 = 예상수량 × 상태별 반영률
확정수요 = OL 합계 + SFDC 추가수요 + Bulk 추가수요
```

`confirmDemand`와 “확정본 저장” 버튼은 현재 브라우저 상태만 변경하며 실제 저장을 수행하지 않는다.

#### `components/workflow/supply-step.tsx`

전월말 가용재고와 Open PO를 발주계산의 입력 전제조건으로 보여주는 화면이다.

- 가용재고, 가용 Open PO, 납기 위험 PO KPI
- 재고 상태별 반영/제외 기준
- Open PO별 Supplier, 예정월도, 반영 상태
- Supplier, Lead Time, 운송·통관, 검수 입력 항목 안내

현재 값은 JSX 내부 샘플값이며 편집/저장 기능은 비활성화되어 있다.

#### `components/workflow/master-step.tsx`

발주량 계산 전에 필요한 기준정보 준비 상태를 보여준다.

- 품목·기종
- BOM·Common품
- 장착율·사용량
- MOQ·발주단위
- Supplier별 Lead Time
- Flexibility Rule

검증 체크리스트와 향후 Excel/CSV 업로드 영역을 제공하지만, 실제 마스터 조회·검증·업로드는 아직 구현되지 않았다. 파일 내부의 `UploadIcon`은 업로드 버튼 표시용 소형 SVG 컴포넌트다.

#### `components/workflow/calculation-step.tsx`

발주량 계산 결과와 예외 검토의 화면 구조를 보여준다.

- 기기 및 옵션·부품 발주량 KPI
- 총 발주금액과 예외품목 수
- 품목별 확정수요, 가용재고, 순소요량, 최종발주량
- Flexibility Rule 초과, MOQ 과잉, 납기 미확정 예외 목록
- 수동 조정 저장 구조에 대한 안내

표시값은 샘플 계산 결과이며 계산 서비스나 수동조정 저장은 연결되어 있지 않다.

#### `components/workflow/report-step.tsx`

경영진 보고자료 화면의 미리보기다.

- 당월 총 발주금액
- 전년 동월 및 OL 제출 대비 증감
- Open PO 반영으로 인한 감소 품목
- 전월/당월 발주금액 비교표
- 보고서 레이아웃 미리보기
- Excel/PDF 다운로드 버튼 자리

다운로드 버튼은 `disabled` 상태이며 실제 파일 생성 기능은 향후 단계다.

### 4.3 `lib/`: 외부 서비스 및 공통 인프라 계층

현재 `lib`에는 Supabase 연결 모듈만 존재한다. 업무 도메인 모델, 계산 서비스, API client, Repository, validation utility는 아직 분리되어 있지 않다.

#### `lib/supabase/client.ts`

브라우저에서 호출할 Supabase 클라이언트 팩토리다.

- `NEXT_PUBLIC_SUPABASE_URL` 확인
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인
- 누락 시 변수명을 포함한 오류 발생
- `createClient(url, key)`로 `SupabaseClient` 반환

현재 어떤 화면에서도 import하지 않으므로, 이 파일의 존재만으로 앱이 데이터베이스에 접근하지는 않는다.

#### `lib/supabase/server.ts`

서버 컴포넌트나 향후 Route Handler에서 사용할 클라이언트 팩토리다. 브라우저용과 동일한 공개 URL/anon 또는 publishable key를 검증하고 `createClient`를 호출한다.

현재는 service role key, cookies, Auth, 테이블 CRUD를 참조하지 않는다. 실제 서버 데이터 접근을 추가할 때는 RLS와 서버 전용 권한 경계를 먼저 설계해야 한다.

### 4.4 `docs/`: 설계·요구사항·개발 기록

#### `docs/superpowers/specs/`

구현 전에 작성한 요구사항과 설계 기준을 보관한다.

- `2026-08-13-procurement-planning-mvp-prd.md`: 제품 목표, 사용자, 업무 흐름, 기능 요구사항, 계산 규칙, 데이터 모델, 테스트 기준
- `2026-08-13-supabase-connection-design.md`: Supabase 클라이언트 연결의 범위, 보안 원칙, 환경변수와 검증 기준

#### `docs/superpowers/plans/`

작업을 단계별로 나눈 구현 계획을 보관한다.

- `2026-08-13-procurement-planning-mvp-plan.md`: 로컬 MVP 화면 구현 계획
- `2026-08-13-supabase-connection-plan.md`: Supabase 의존성, 클라이언트 팩토리, 문서화, 빌드 검증 계획

이 문서들은 런타임에 로드되지 않으며 개발·운영 참고 자료다.

### 4.5 `outputs/`: 생성된 업무 산출물

`outputs/<작업 식별자>/` 아래에 Excel 업무 정의서, 검사 결과 NDJSON, 시트별 PNG 미리보기가 저장되어 있다.

- `기기_옵션_월간발주_프로세스정의서.xlsx`: 프로세스맵, 상세 프로세스, 계산규칙, 데이터정의, RACI, KPI, 발주계산 템플릿 등을 포함한 업무 정의서
- `*.inspect.ndjson`: 생성된 workbook의 셀/수식 검사 결과
- `preview_*.png`: Excel 시트 시각 검토용 이미지

이 폴더는 웹 앱의 런타임 정적 자산이 아니라, 업무 분석 및 산출물 검증 결과를 보관하는 작업 결과 영역이다.

### 4.6 루트 생성 스크립트

#### `build_dummy_demand_data.mjs`

`@oai/artifact-tool`을 이용해 2025년 수요확정 테스트용 workbook을 생성한다. OL, SFDC Pipeline, Bulk-deal, 실적 Trend, 수급회의 확정수요, 월별 요약 시트를 만들고 수식 검사와 PNG 렌더링을 수행한다.

주의할 점은 출력 경로가 현재 개발 환경의 절대경로로 하드코딩되어 있다는 것이다. 다른 환경에서 재사용하려면 출력 디렉터리를 `process.cwd()` 기준 또는 CLI 인자로 바꾸는 작업이 필요하다.

#### `build_workbook.mjs`

기기·옵션 월간 발주 업무의 프로세스 정의서와 발주 계산 템플릿 workbook을 생성한다. 시트별 제목/부제/색상/표 스타일을 만들고, 업무 정의·계산 규칙·데이터 정의·RACI·KPI·샘플자료·정책결정·FX-LIVE 연계 내용을 구성한다.

이 스크립트도 출력 경로가 절대경로로 지정되어 있으며, `package.json`의 실행 스크립트에는 등록되어 있지 않아 필요할 때 직접 실행하는 도구다.

### 4.7 루트 설정 및 문서 파일

#### `package.json` / `package-lock.json`

Next.js 15, React 19, TypeScript, `lucide-react`, `@supabase/supabase-js` 의존성과 `dev`, `build`, `start` 명령을 정의한다. `package-lock.json`은 설치 버전을 고정한다.

#### `next.config.ts`

Next.js 설정 객체를 제공하며 현재는 `reactStrictMode: true`만 활성화되어 있다.

#### `tsconfig.json`

엄격한 TypeScript 검사(`strict: true`), Next.js 플러그인, bundler 모듈 해석, JSX preserve와 `@/*` 경로 별칭을 설정한다. 빌드 산출물은 만들지 않고(`noEmit: true`) Next.js가 타입을 처리한다.

#### `vercel.json`

배포 플랫폼에서 이 프로젝트를 `nextjs` 프레임워크로 처리하도록 지정한다.

#### `.env.example`

다음 공개 환경변수의 형식을 제공한다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

실제 `.env.local`은 로컬 환경에만 두고 Git에 커밋하지 않는다. Service role key는 `NEXT_PUBLIC_*`에 넣으면 안 된다.

#### `.gitignore`

`node_modules`, `.next`, 환경변수 파일, TypeScript 임시 파일, Vercel 로컬 파일 등을 Git 추적 대상에서 제외한다.

#### `README.md`

프로젝트 실행 방법, 현재 Phase 1 범위, 다음 구현 단계, Supabase 로컬/Vercel 환경변수 설정과 키 보안 원칙을 안내한다.

#### `2026-08-13-procurement-planning-mvp-prd.md`

루트에 있는 제품 요구사항 문서의 복사본이다. 제품의 업무 의미와 향후 구현 범위를 확인할 때 사용한다.

---

## 5. 런타임 동작 흐름

1. 사용자가 `/`에 접근한다.
2. `app/layout.tsx`가 공통 HTML, 메타데이터, 전역 CSS를 준비한다.
3. `app/page.tsx`가 `ProcurementApp`을 렌더링한다.
4. `ProcurementApp`은 기본값인 `dashboard` 단계를 활성화한다.
5. 사용자가 사이드바, 진행 표시줄, KPI 카드 또는 이전/다음 버튼을 누르면 `active` 상태가 변경된다.
6. `active` 값에 따라 해당 `workflow/*-step.tsx` 컴포넌트가 렌더링된다.
7. 수요 화면의 입력 변경은 `DemandStep` 내부 React state와 `useMemo` 계산 결과에만 반영된다.
8. 브라우저 새로고침 시 모든 입력값과 확정 상태는 초기 샘플값으로 돌아간다.

---

## 6. 데이터 및 저장 구조

### 현재 구조

```text
JSX 샘플값
  └─ React useState / useMemo
       └─ 현재 브라우저 세션의 화면 표시
```

현재 구현에는 다음 계층이 없다.

- API Route 또는 Server Action
- SQLite/PostgreSQL 테이블 및 migration
- Repository 또는 service 계층
- 파일 업로드 처리
- 사용자 인증 및 권한
- 수요/재고/마스터/계산 결과의 영속 저장

### 예정 확장 구조

PRD와 README 기준으로 향후 SQLite 또는 Supabase를 연결하고, 입력·계산·저장·보고서 생성을 실제 기능으로 교체하는 방향이다. 그때는 화면 컴포넌트에 직접 들어 있는 샘플값과 계산식을 다음처럼 분리하는 것이 적절하다.

```text
workflow UI
  ▼
도메인 서비스 / 계산 서비스
  ▼
Repository 또는 API 계층
  ▼
SQLite 또는 Supabase PostgreSQL
```

특히 수요 확정, 발주량 계산, 수동 조정 이력은 화면 state와 분리해 버전·확정자·확정일시·조정사유를 저장하는 구조가 필요하다.

---

## 7. 업무 단계와 컴포넌트 매핑

| 업무 단계 | 컴포넌트 | 주요 입력/표시 |
|---|---|---|
| 전체 현황 | `DashboardStep` | 진행상태, KPI, 발주계획 목록 |
| 수요 확정 | `DemandStep` | OL, SFDC, Bulk-deal, Trend, 수급회의 |
| 재고·공급 | `SupplyStep` | 전월말 재고, Open PO, Lead Time |
| 마스터 검증 | `MasterStep` | 품목, BOM, 장착율, MOQ, Supplier 기준정보 |
| 발주량 계산 | `CalculationStep` | 순소요량, MOQ, Flexibility Rule, 예외 |
| 보고자료 | `ReportStep` | 발주금액 비교, 보고서 미리보기, 다운로드 자리 |

---

## 8. 현재 아키텍처의 특징과 제약

### 장점

- 업무 플로우를 빠르게 검증할 수 있는 단순한 구조다.
- 단계별 컴포넌트가 분리되어 화면 수정 범위를 파악하기 쉽다.
- 공통 단계 프레임과 전역 스타일을 사용해 UI 중복이 적다.
- Supabase 연결 진입점이 브라우저/서버로 분리되어 향후 전환 경로가 준비되어 있다.
- 실제 비밀키를 소스에 넣지 않는 환경변수 계약이 있다.

### 제약

- 화면의 샘플 데이터가 컴포넌트 소스에 직접 들어 있다.
- 상태가 컴포넌트별로 분산되어 단계 간 데이터 연계가 없다.
- 수요 확정 및 저장 버튼이 실제 영속 저장을 하지 않는다.
- 계산 결과가 업무 규칙 엔진이 아니라 표시용 하드코딩 값이다.
- API, DB schema, migration, RLS, Auth가 없다.
- 자동화된 테스트 스크립트와 `test` 명령이 없다.
- Excel 생성 스크립트의 출력 경로가 특정 개발자의 절대경로로 되어 있다.

---

## 9. 권장 확장 순서

1. 도메인 타입과 저장 모델을 정의한다.
2. 발주계획·수요·재고·Open PO·마스터·계산 결과 테이블과 migration을 만든다.
3. 수요 확정과 발주량 계산을 화면 밖의 service 함수로 분리한다.
4. Repository/API 계층을 추가하고 UI의 샘플 state를 조회·저장 호출로 교체한다.
5. 확정본과 수동 조정 이력을 immutable version 또는 audit 구조로 저장한다.
6. 파일 업로드 검증과 Excel/PDF 생성 기능을 연결한다.
7. Auth/RLS와 역할별 승인 흐름을 적용한다.
8. 계산 규칙, 검증 오류, 단계 이동, 저장/조회에 대한 자동화 테스트를 추가한다.

이 순서를 따르면 현재 프로토타입의 시각적 구조를 유지하면서도 화면·업무 규칙·저장소를 점진적으로 분리할 수 있다.

