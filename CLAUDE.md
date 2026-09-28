# GameCove — 프로젝트 규칙

Figma 디자인을 Next.js로 옮기는 프로젝트. 이 파일의 규칙은 모든 작업에 적용한다.

## 프로젝트
- 스택: Next.js (App Router) + TypeScript + Tailwind CSS
- 저장소: https://github.com/whdhrrk/GameCove (비공개)
- 진행 순서: (토큰 완료) → ① 화면/플로우 구현 → ② 더미 데이터 연결 → ③ 화면이 데이터에 따라 제대로 반응하는지 검증 → ④ AI API 연결
- 더미 데이터는 `data/` 등 한곳에 모으고, 카드·차트는 데이터에 따라 달라지게 만든다. 필터링 결과에 따라 카드가 바뀌어야 한다.

## 데이터 구조 (UI 단계부터 적용)
- 지금은 UI부터 구현하지만 나중에 더미 데이터를 연결한다. 지표 값, 차트 데이터, Stage별 정보, 목록 항목(프로젝트·멤버·이벤트·노드 등)은 JSX 안에 하드코딩하지 않는다.
- 컴포넌트는 표시할 값을 props로 받는다. 화면은 데이터 객체(`data/` 아래 파일)를 읽어 컴포넌트에 넘긴다. 데이터 파일만 바꾸면 화면이 바뀌어야 한다.
- 데이터 모양은 TypeScript 타입으로 정의한다 (예: `data/types.ts`). UI 단계의 값은 Figma에 적힌 값을 그대로 데이터 파일에 옮긴다.
- 고정 문구(버튼 라벨, 섹션 제목 등)는 데이터 파일이 아니라 아래 i18n locale 객체에 둔다.

## 다국어 (i18n)
- 영문 UI를 먼저 구현하고 나중에 한글을 추가한다. 사용자에게 보이는 모든 텍스트(버튼 라벨, 제목, placeholder, 툴팁, aria-label, 빈 상태 문구, API 더미 응답 포함)를 JSX·API 코드에 하드코딩하지 않는다.
- 문구는 `lib/i18n/messages/en.ts`, `ko.ts`에 둔다 (`Messages` 타입이 키 누락을 막는다). 컴포넌트는 `useI18n()`의 `t`로 읽고, 서버 코드(API 라우트 등)는 `getMessages(locale)`를 쓴다.
- 언어는 URL query에 둔다: 기본 영어, `?lang=en` / `?lang=ko`. 앱 안 전환은 내비 Setting > Language (English / 한국어, 내부 확인용, `useI18n().setLocale`)만. 내부 링크는 `useI18n().href(path)`로 만들어 `lang`을 유지한다.
- 숫자·복수형·시간이 들어가는 문구는 locale의 함수로 만든다 (예: `t.workspace.projectCount(3)` → "3 projects"). 데이터에는 문장이 아니라 값만 둔다 (예: `activity: { kind: "updated", daysAgo: 1 }`, `platform: "roblox"`).
- 고유명사(프로젝트명, 사람 이름, 이메일, 브랜드 "GameCove")는 데이터로 두고 번역하지 않는다.

## UT 흐름 (프로토타입 동선)
- UT 순서: Task1 → ("일주일이 지났다"는 상황 전달) → Task2.
- Task1: 워크스페이스 (셋업 전) → BounceBounce 클릭 → 매핑 셋업 팝업 → Mapping Step 1~3 → Logging setup Step 1~3 → Apply → Tracked (logging applied) 화면.
- Tracked 화면에서 내비 Workspace 클릭 → 워크스페이스 (셋업 후). 여기서 Task2 시작 → BounceBounce 클릭 → 대시보드 (Overview / Engagement / Retention / Experience).
- 내부 확인용: 워크스페이스 (셋업 전)에서 다른 두 게임(Tower Escape, Lantern Harbor)을 누르면 셋업 없이 바로 대시보드로 간다. 대시보드 구현 후 연결.
- 셋업(매핑·로깅) 진행 중에는 AI Agent 사용 불가. 내비의 다른 항목이나 온보딩 팝업 X를 누르면 "Leave setup" 모달을 띄운다. Leave = 실제로 그 페이지로 이동 (팝업·드로어 X의 Leave: 매핑 = Overview, 로깅 = 0 tracked).
- 셋업 진행 상태는 `lib/setup-store.ts`에 남아서, 다른 페이지에 갔다가 Tracking(또는 워크스페이스에서 BounceBounce)으로 돌아오면 직전 단계부터 이어진다 (새로고침하면 처음부터). 0 tracked의 Add logging = 로깅 직전 단계부터, 흐름 완료(Tracked) 뒤 Add logging = 무반응.
- 셋업 흐름을 끝낸 뒤 워크스페이스 = 셋업 후 워크스페이스 (data/workspace.ts projectsAfterSetup). 프로젝트 기본 화면 = Overview.

## Logging setup (분석 선택 → 추적 항목) — 단일 기준 (규칙 v3)
- 데이터: `data/logging.ts` (mappingNodes / analysisOptions / trackingItems / commonProperties / observationScript·observationScriptBlocks / instrumentationScriptTemplates / loggingLoadingMs). 계산: `lib/logging-setup.ts`. 화면은 이 값만 읽는다. 분석·구조·이벤트·속성·스크립트를 화면에 하드코딩하지 않는다.
- Node는 매핑 UI 내부 개념일 뿐 — 로깅 이벤트·속성 이름으로 노출하지 않는다. node_entered / node_exited / node_id / destination_node_id는 쓰지 않는다. 로깅은 BounceBounce 실제 구조(Lobby + Stage) 기준. 매핑 구조(lobby, stage_1~4)는 이벤트를 어디서 관찰·삽입할지 정하는 데만 쓰고, 범위 줄은 구조 라벨을 하나씩 ("Lobby · Stage 1 · …", "All stages" 아님).
- 이벤트: Ready(Observation) = session_started, session_ended, lobby_entered, stage_entered[stage_id]. Requires setup(Instrumentation) = stage_completed[stage_id], stage_exited[stage_id, destination, exit_type], attempt_failed[stage_id, fail_cause], star_collected[stage_id, star_index]. Stage마다 이벤트를 따로 만들지 않고 stage_id 값으로 구분. stage_id = 매핑이 찾은 게임 코드의 Stage 식별 값을 정규화한 속성.
- 화면 표시는 사람이 읽는 라벨 (i18n `t.logging.events`): Session started / Session ended / Lobby entered / Stage entered / Stage completed / Stage exited / Attempt failed / Star collected. config id는 snake_case.
- 분석 6개 (라벨·설명 i18n `t.logging.analysis`): Game progression / Session exit locations / Failures by stage / Time spent by location / Within-stage progress / Session flow. 필요한 이벤트는 data 그대로 (어떤 칩 하나만 골라도 Requires setup ≥ 1, 중복 제거).
- 공통 값 player_id / session_id / timestamp: 로깅 셋업(Step 2 Properties, Step 3 Events & properties)에서는 칩이 아니라 Figma `Notice / Logging` 모양(초록 점 + status/positive 문장)으로 "… are recorded automatically — nothing to add". 어떤 값이 기록되는지는 보여주되 추가할 필요 없다는 뜻. Tracked(Event detail·Node detail)에서는 실제로 기록되는 속성 전부(공통 포함)를 보여준다.
- 이벤트 범위 = 그 이벤트를 쓰는 선택된 분석의 targetNodeIds 합집합 ∩ 이벤트의 appliesTo. Tracked 노드의 "n events"는 이 범위 기준, Active 켜진 Ready 이벤트만 (0이면 "0 tracked"). Pending은 노드가 아니라 Pending 칩에.
- 스크립트: Step 3 "Script to be added" = 서버 쪽 공용 observation logger `GameCoveLogger`, 위치 칩 `ServerScriptService > GameCoveLogger`만 ("Script ·"·LocalScript·StarterPlayerScripts 표기 없음). 카드 순서: 스크립트 이름 → 위치 → 설명. "Script to be added" 옆 ⓘ. Step 3 섹션 제목은 모두 primary (Pending 포함). 내용은 켠 Ready 이벤트 블록만. Pending(Instrumentation)은 각자 기존 게임 로직(완료·이동·실패·별 수집)에 들어가는 것 — GameCoveLogger와 섞지 않고, 지금은 화면에 스크립트를 보여주지 않는다 (Step 3 Pending 카드에 View script 없음, Tracked Pending 항목은 눌러도 반응 없음).
- 흐름: 매핑 완료 모달 Set up logging → Step 1 / Not now → 0 tracked. Step 1: 칩 선택 → Selected, × → Recommended, Reset(칩+입력), 칩 1개 이상이어야 Save & Next (자연어 입력은 반영 안 함), 칩 hover = 분석 설명 툴팁. Step 2: Ready 카드 체크(기본 켜짐), Details 기본 숨김, Add to pending → pending 색 문구 + Cancel. 켠 Ready ≥1 또는 Pending ≥1이어야 Save & Next. Step 3: 스크롤이 있으면 끝까지 내려야, 없으면 3초 뒤 Apply. 로딩: 1→2 4초, 2→3 2.5초 (버튼 자리 스피너), Apply 5초 (드로어 본문 로딩) → Tracked.
- 로깅 셋업 중: AI Agent 무반응, 드로어 X·내비 → Leave 모달(Logging), Leave = 0 tracked. Tracked·0 tracked: 내비 바로 이동, Add 메뉴(Add node / Add logging — Add logging은 무반응).
- Tracked: Events 칩 → Tracked events 패널(드래그, X) → 이벤트 클릭 = 범위 노드 선택 + 가운데로 + Event detail 드로어(Active 토글이 노드 수에 반영, Delete event는 보이기만). Pending 칩 → Pending setup 패널까지만. 노드 클릭 → Node detail 드로어 (Data 탭만).
- 툴팁(ⓘ)은 portal로 띄워 드로어에 잘리지 않고 화면 안으로 맞춘다. 문구는 임시(디자이너가 마지막에 한 번에 수정). 지표 데이터 툴팁은 제외.
- 가운데 모달(매핑 셋업 팝업, 매핑 완료, 스크립트)은 내비·상단 바를 뺀 본문 영역 가운데에 띄운다 (`Modal contained`). scrim은 화면 전체.
- 실제 Roblox 연결·스크립트 분석·코드 수정·에이전트 실행·DB·텔레메트리는 구현하지 않는다 (UT용 시뮬레이션).

## Dashboard (Overview / Engagement / Retention / Experience / Explore)
- 구현 순서: ① 페이지 레이아웃 → ② 카드 UI → ③ Information tooltip → ④ 기본 interaction·filter UI → ⑤ dummy dataset 연결 → ⑥ 데이터에 따른 카드 상태·화면 변화 → ⑦ Data hover tooltip → ⑧ Explore 추천 AI 연결 → ⑨ Ask COVY Agent AI 연결. UI 단계에서는 ⑤~⑨를 실제로 구현하지 않고 연결하기 쉬운 구조만 둔다.
- UI와 데이터 분리: 카드 안에 숫자·차트 값·stage 이름·funnel 값 등을 하드코딩하지 않는다. 모든 대시보드 데이터는 별도 data layer(`data/dashboard/…` + 조회 함수)에서 받는다. UI 단계에서는 임시 mock을 쓰되, 나중에 디자이너가 주는 **하나의 dummy dataset**으로 통째로 교체할 수 있게 한다. 모든 페이지가 같은 dataset을 기준으로 동작한다.
- Filter(기간·국가·기기·신규/재방문 등)는 이후 같은 dataset을 필터링하도록 연결한다 → 조회 함수는 filter 객체를 인자로 받는 모양으로 만든다.
- 카드 = 재사용 컴포넌트 + props/data object. 같은 유형(KPI, time series, funnel/progression, stage metrics, visit & exit, retention 등)은 공통 컴포넌트를 재사용. 컴포넌트 안에서 데이터를 정의하지 않는다.
- Tooltip 두 종류: **Information tooltip**(지표명·카드 제목 옆 ⓘ hover) = 지금 구현, 디자이너가 주는 지표별 정의/기준/해석 문구를 그대로 (i18n). **Data hover tooltip**(line·point·bar·funnel step 등 실제 값) = dummy data 연결 후 구현. 지금은 차트 컴포넌트에 hover 레이어를 붙이기 쉬운 구조만.
- Explore 추천 질문: UI에 하드코딩하지 않고 `getRecommendedQuestions(context)` 독립 함수로 받는다 (지금은 mock 반환, AI 호출 없음). context = 보고 있던 metric/card, 현재 page, date range/filter, game structure/mapping, dataset에서 실제 조회 가능한 데이터, 선택된 분석 대상. 나중에 함수만 실제 AI API로 교체.
- Agent(Ask COVY): UI와 로직 분리 — `askCovy(userMessage, context)` (지금은 mock 응답). context = game structure, 사용 가능한 metrics/events/properties, dashboard dummy data, current page, selected card/metric, filters/date range, logging/tracking status. Explore와 같은 GameCove data context를 쓴다.
- AI 규칙(연결 시 필수): dummy dataset 안에서 실제 확인 가능한 것만 분석. tracking/logging되지 않는 데이터는 분석 가능하다고 가정하지 않음. 데이터가 없거나 부족하면 명확히 말함. 필요한 logging이 없으면 필요한 event/property를 안내. 숫자·결과를 지어내지 않음.
- AI 호출은 서버 API 라우트를 거친다 (아래 "AI 추천질문" 규칙: 키는 `.env.local`, 서버에서만).

- 구현 위치: dataset `data/dashboard/bounce-bounce.json` + `dataset.ts`(기본값·선택지), 타입 `data/dashboard/types.ts`, 조회 `lib/dashboard/queries.ts`(지표별 get…(filters)), 형식 `lib/dashboard/format.ts`. 카드 `components/dashboard/cards.tsx`(재사용), 지표 연결 `metric-cards.tsx`, 페이지 `pages.tsx`. Stage progression 처음 탭은 dashboardDefaults.stage(Stage 2).
- AI: `lib/ai/service.ts`(getRecommendedQuestions / getBriefing / askCovy — 제공자 없으면 `lib/ai/mock.ts`, dataset에서 계산한 mock) → API 라우트 `/api/ai/recommended-questions`, `/api/ai/briefing`, `/api/ai/covy` → 클라이언트 `lib/ai/client.ts`. 공통 context 타입 `lib/ai/context.ts`.
- 토글 카드(Average/Total, Per user/Total, New/Returning)는 토글마다 다른 데이터. New and returning users: 고른 쪽이 파랑(primary), 다른 쪽 회색(context/secondary), 범례도 따라 바뀜.
- 아코디언: Exit rate 행 → Session flow (Overview·Experience), Date cohort 행 → Retention by progression (Retention). 기본은 닫힘. 같은 행/뒤로 바 = 닫기. 열린 하위 카드는 위 카드와 24px (카드 사이 48의 절반).
- Explore: 카드의 Explore → `/projects/[id]/explore?metric=…&selection=…`에 그 카드 + AI 추천 질문 칩. 칩 → AI Agent가 같은 context로 답.
- AI Agent: 상단 바 버튼 → 오른쪽 패널 (Empty / Clarifying / Answer, 넓게 보기). 셋업 중에는 hover만.
- 내비: Project members → 팝오버, Custom Board > Add Board → 커스텀 보드 모달(본문 가운데). 페이지 ⋮ = Menu / Page actions, 카드 ⋮ = Menu / Card actions, 필터 = Drawer / Filter by category, Breakdown = 체크 드롭다운, Time interval = Days.

## AI 추천질문 (LLM 연결)
- LLM 제공자는 아직 미정. 서버 API 라우트(`app/api/...`) 하나를 거치게 만들고, 제공자가 정해지기 전까지는 더미 응답을 돌려준다. 나중에 제공자 호출 부분만 교체할 수 있게 분리한다.
- API 키는 반드시 `.env.local`에만 두고 서버에서만 읽는다. 클라이언트 코드나 `NEXT_PUBLIC_` 변수에 넣지 않는다.
- `.env*.local`은 `.gitignore`에 포함하고, 키 이름만 적은 `.env.example`을 커밋한다.

## Figma 소스
- 파일: `Wo3idJosx0yA31LVu2Rb59` (페이지 `수정 디자인-완성` + 컴포넌트 페이지). 이전 파일: `04tM8TVwuuV5bjFH2gxLJF`.

## Figma 충실도 (중요 — 전부에 적용)
- Figma에서 읽은 값을 그대로 쓴다: 폰트 크기, 굵기, 행간, 자간, padding, gap, radius, 선 두께, 아이콘 크기, 색. 반올림하거나 비슷한 값으로 바꾸지 않는다 (13px은 13px). 값이 다른 기존 컴포넌트/유틸로 대체하지 않는다.
- 폰트 굵기: Figma의 굵기(Regular / SemiBold / Bold)를 그대로 쓴다. 사용하는 모든 굵기를 웹폰트로 로드해서 브라우저가 가짜 굵기나 다른 굵기로 대체하지 않게 한다.
- 아이콘: Figma 아이콘 에셋을 그대로 다운로드해서 같은 크기·선 두께로 쓴다. 아이콘 라이브러리의 비슷한 아이콘으로 바꾸지 않는다.
- 원형 요소(아바타, 프로필 이미지, 동그란 아이콘 타일, 점): Figma는 마스크나 ellipse로 만들어서 에셋이 사각형으로 나오는 경우가 많다. 항상 `border-radius: 50%`(`rounded-full`) + `overflow: hidden`, 이미지는 `object-fit: cover`로 구현한다. 고정 px radius에 의존하지 않는다.
- 마스크/클립: Figma에서 마스크·클립된 레이어는 CSS로 클립 모양을 재현한다 (radius + overflow hidden, 또는 clip-path). 사각형 원본 에셋을 그대로 쓰지 않는다.
- 필요하면 컴포넌트 인스턴스를 메인 컴포넌트의 내부 레이어까지 읽는다 (radius, clip, stroke가 거기 있는 경우가 많다).
- 오토레이아웃이 아닌 절대 위치 레이어: 위치·간격을 추정하지 말고 실제 Figma 좌표에서 가져온다.
- 예외: 아래 막대 채움·히트맵 규칙은 Figma의 padding/opacity 값을 의도적으로 무시한다.
- 화면 구현 후 렌더링 결과를 Figma 프레임 스크린샷과 비교해 모든 차이(모양, radius, 굵기, 간격, 아이콘, 색)를 나열하고, 고친 뒤에 완료로 보고한다.

## 테마 (Dark / Light)
- `GC Semantic` 변수 컬렉션의 색을 CSS custom property로 내보내고 두 테마로 둔다 (Dark 기본, Light). 컴포넌트는 시맨틱 토큰만 참조한다. primitive나 hex 직접 사용 금지.
- 알파가 있는 토큰은 두 테마 모두 알파를 유지한다. 그라디언트 스톱(`chart/area/primary-0…4`)과 그림자 색(`color/effect/*`)도 토큰이다.
- 상단 바의 dark/light 토글로 테마를 전환한다. (`useTheme()` in `lib/theme.ts`, `<html data-theme>`)

## 토큰 사용법 (코드)
- 원본: `tokens/figma-tokens.json` → `npm run tokens` → `app/tokens.css` (생성 파일, 직접 수정 금지). 미리보기: `/tokens`.
- Tailwind 기본 팔레트·radius·text 크기는 지워져 있다. 시맨틱 토큰 이름에서 `color/`를 빼고 `/`를 `-`로 바꾼 유틸리티를 쓴다: `color/bg/canvas` → `bg-bg-canvas`, `color/text/secondary` → `text-text-secondary`, `color/border/default` → `border-border-default`, `chart/label` → `text-chart-label`.
- CSS 변수로 직접 쓸 때(그라디언트, 차트 라이브러리, 인라인 style): `var(--gc-bg-canvas)`, `var(--gc-chart-area-primary-0)`.
- 텍스트 스타일: `text-display-page`, `text-display-metric`, `text-metric-number`, `text-metric-card-title`, `text-title-card`, `text-body-default`, `text-label-default`, `text-caption-default` (크기·행간·자간·굵기 포함). 스타일이 없는 값은 `text-[13px]`처럼 Figma 값 그대로.
- radius: `rounded-sm` 4 / `rounded-md` 8 / `rounded-lg` 16 / 원형은 `rounded-full`. 크기: `h-control-32|40|48`, `size-icon-sm|md`, `w-sidebar`, `h-header`.
- 폰트: `font-sans` = 영어 Lato / 한국어(`?lang=ko`) Pretendard, 둘 다 400/500/600/700 로컬 파일로 같은 굵기 매핑. `font-logo` = Ubuntu 400.

## 막대 채움 길이 (중요)
- Figma는 채움 길이를 padding으로 흉내 낸다 (가로 막대는 Track의 paddingRight, 세로 막대는 segment의 paddingTop). 코드에서는 그 padding을 절대 복사하지 않고, 데이터 비율로 채움 크기를 정한다 (예: `width: 63.4%`).

## 히트맵 셀
- 셀 색 = `chart/heatmap/accent`(date cohort) 또는 `chart/heatmap/emphasis`(progression cohort)를 배경 레이어에 깔고, 그 opacity를 테이블 안 값에 선형으로 매핑한다: 최솟값 → 24%(accent) / 15%(emphasis), 최댓값 → 70%. 텍스트는 불투명 유지. 빈 셀은 `chart/label` 색으로 "–" 표시.

## 성능 (배포)
- 모든 페이지는 정적(●/○)으로 둔다: 서버에서 cookies()·searchParams를 읽지 않는다 (테마 = layout의 beforeInteractive 스크립트, query = 클라이언트 useSearchParams/location). 내비·워크스페이스는 이동할 화면을 router.prefetch. Overview AI 브리핑은 빌드 때 계산해 HTML에 넣는다.

## 대시보드 데이터 (BounceBounce 더미)
- 원본(source of truth): `data/source/BounceBounce_DummyData_v6_day8.xlsx` (v5 Day 1~7 + Day 8, `npm run data:day8`로 v5에서 생성) → `npm run data` → `data/dashboard/bounce-bounce.json` (players / sessions / stageRuns / meta). 검증: `npm run data:check` (Excel Summary와 대조), `npm run data:verify` (Day 1~7 불변 + Day 8 패턴). 전부 PASS여야 함.
- 기간: UT 시점 = Day 8(9/22) 저녁. Overview = Today(9/22) vs previous 7 days(9/15~21 날짜별 값 평균). 다른 페이지의 Last 7 days = Today 이전 완료된 7일(9/15~21). 리텐션은 데이터 마지막 날(Today)까지 관측된 것으로 계산.
- 화면 값은 전부 `lib/dashboard/queries.ts`가 raw에서 계산한다. Summary 시트 값을 화면에 옮기지 않는다.
- 필터 범위: Engagement·Retention = 페이지 필터 + Breakdown, Explore = 페이지 필터만, Overview·Experience = 페이지 필터 없음(카드 안 Filter by만). 카드 Filter by는 그 카드에만 AND로 추가 (Exit rate와 Session flow는 같은 카드 필터).
- New and returning users·Traffic sources·코호트 표에는 Breakdown 미적용. New and returning·Traffic은 필터도 미적용, Traffic은 New/Returning 토글을 따른다.
- Breakdown: 한 차원만 (다른 차원 체크 시 이전 선택 해제). 선 차트는 카테고리별 선 + 범례, 머리 숫자 숨김. 막대·퍼널은 행마다 카테고리별 18px 막대. 색은 `BREAKDOWN_SERIES_COLORS`만.
- 비교 기간 데이터 없음 → "— No comparison data". 계산 불가 값은 null → "–" (0으로 만들지 않음). D1 머리 숫자 = 관측 가능한 날짜별 D1의 평균. Retention 선 차트는 관측 불가 날짜를 0%로 그린다(머리 숫자 계산에는 제외). D7은 9/15 cohort만 관측(Day 8 부분 일자), 값이 없으면 머리 숫자 0.00%.
- "Data through …"는 페이지 머리 ⋮ 왼쪽, 14 secondary, 시간대 표기 없음.

## 차트
- `Chart / Line`, `Chart / Stacked bar`는 플레이스홀더다: 차트 라이브러리와 더미 데이터로 그리고, Figma의 눈금 라벨과 토큰 색을 쓴다 (축 숫자 `chart/label`, 그리드 `chart/grid`, 영역 그라디언트 `chart/area/primary-*`).

## 버튼 & 텍스트
- Primary 버튼 hover = `color/bg/hover-subtle` 반투명 레이어를 버튼 위에 덮는다 (확정, `components/ui/button.tsx`의 `hover-layer`).
- 버튼 라벨 굵기: Primary 버튼(다크 흰색 / 라이트 파랑) 라벨만 SemiBold. Secondary, Pill 등 나머지 버튼 라벨은 Regular. primary 버튼 아이콘은 2px stroke. Primary = `color/bg/button-primary` + `color/text/on-button-primary`. Secondary(Explore, ⋮) = `color/bg/button-secondary`, `color/border/button-secondary`, `color/text/button-secondary`.
- 툴팁 = 정보 아이콘(ⓘ) hover 시 표시. 텍스트 14px Regular, `color/bg/tooltip`, `color/border/tooltip`, `color/text/tooltip`, radius 8, padding 12. 지표별 툴팁 문구는 아직 없으므로 placeholder 텍스트 사용.

## Hover & 선택 상태
- hover/선택 시 폰트는 절대 바뀌지 않는다. 보조 텍스트/아이콘은 hover/선택 시 primary로 바뀐다 (내비 항목 포함).
- hover/선택된 행: `color/data/select/row` 레이어, radius 8, cursor pointer.
- 컴포넌트 상태색: hover = `color/bg/hover`, selected = `color/bg/selected` (Nav item, Icon button 기준). 카드·아이콘 버튼·상단 바 스튜디오 선택·프로필 카드·Pill 버튼 등 hover 상태가 없는 요소도 이 hover 색을 쓴다 (예외: Primary 버튼은 반투명 레이어). AI Agent 버튼은 hover 색만 있고 selected 색은 없다.
- 워크스페이스 내비(워크스페이스·Studio members 화면): 위쪽 Studio 그룹 글자는 primary(Figma 프레임 기준). 프로젝트(대시보드) 내비부터는 `Nav item` 컴포넌트 기본값(secondary).
- 메뉴·드롭다운 radius는 8, 예외로 워크스페이스 필터 드롭다운(All platforms / All roles)은 16.
- 선택된 캔버스 노드: 1.5px `color/border/accent`.

## 컴포넌트 = 컴포넌트 하나 + props
- `Popup / Onboarding`: State = Expanded / Minimised / Loading. props `step`, `title`, `description`, `progress`, `showStep`, `showProgress`, `showBack`, `showMedia` (미디어 슬롯 320×180, radius 8, GIF는 2×, gap 8). Primary 라벨은 "Save & Next"(Step 1, 2) 또는 "Apply"(Step 3).
- `Field / Review`: `status` = identified | not-identified (1px `color/status/critical` 테두리) | pending (1px `color/status/pending` 테두리). 라벨 행 오른쪽에 상태 라벨 + 16px 아이콘, 아이콘은 텍스트 왼쪽, 1px stroke.
- 데이터 행(`Cohort row`, `Bar row`, `Progress row`, `Funnel row`)은 `selected` prop: 행 뒤에 반투명 레이어 (좌우 12px, 상하 4px bleed, absolute). 색 변경·밑줄 없음.
- `Checkbox option`: `checked`가 true면 체크 아이콘 표시.
- 본문 옆 링크: 14px, 밑줄, 본문 색, + 14px ↗ 아이콘 (stroke ~1.2), gap 4px.
- `AI Agent / Composer`: `context` on/off. placeholder "Ask anything...". 내용에 따라 높이 자동 증가.

## AI Agent 패널 — 시작 화면
- 빈 채팅: Covy + "What are you working on?". 하단: "Start with a task" + `AI Agent / Start template` 행 3개: 32px 아이콘 타일(`color/bg/accent-subtle`, radius 8, 16px 아이콘 `color/icon/ai`) + 제목 14 Bold + 설명 12 secondary. Set up logging / Investigate data / Plan your next move.
- 행 클릭 시 같은 채팅에서 해당 대화를 시작한다. hover = 행 배경만. 넓은 패널: 리스트를 composer 폭(760)에 맞춘다.

## Tracking
- 캔버스 배경 `color/bg/tracking-canvas` (상단 바 아님). 노드: 테두리 그라디언트 `color/border/node-*`, 아이콘 타일 `color/bg/node-inset`, 상태 행 tracked `color/bg/node-status-tracked` / idle `color/bg/node-status-idle`, glow `color/effect/node-glow`.
- "Events n" 칩 → `Panel / Tracked events` 열림 (좌하단, 드래그 가능, X로 닫기, 그림자 `color/effect/shadow-elevated`). 이벤트 클릭: 선택 행 레이어, 해당 이벤트를 수집하는 모든 노드에 선택 테두리, `Drawer / Event detail` 열림 (Active 토글은 `color/control/knob`).
- 노드 클릭: 선택 테두리 + `Drawer / Node detail · Data` (탭 Overview / Data / Mapping, Data만 구현).

## Overflow & 스크롤
- 박스는 내용에 맞춰(hug) 늘어난다. 긴 페이지/패널은 세로 스크롤. 드로어는 헤더·푸터 고정. 입력창/textarea는 자동으로 높이가 늘고 내부 스크롤하지 않는다 (textarea 최소 96px, input 48px).

## Figma에 안 그려진 인터랙션 (구현할 것)
- Step 2: 노드 클릭 시 480px 드로어가 열리고, 드로어 왼쪽의 보이는 캔버스 중앙에 노드가 오도록 부드럽게 이동(pan)한다.
- Step 2 진행도: 선택한 노드는 검토 완료로 센다 ("n / 5 nodes reviewed"). 검토된 노드는 1.5px `color/status/positive` 테두리.
- Step 2 드로어: "Apply this to other structures?" 아래 구조를 체크하면 그 노드가 연파랑 선택 스타일로 강조되고, 체크 해제 시 해제된다.
- Add 버튼: Mapping Step 1에만 있다 (메뉴에는 "Add node"만). Step 2부터 한동안 캔버스에 Add 버튼 없음.
- Mapping Step 1 캔버스
  - 확대/축소: +, − 버튼, Ctrl+스크롤, Ctrl+드래그. 세 번째 버튼 = 원래 배율로 돌아오며 노드를 화면 가운데로.
  - 화면 이동: 스페이스바를 누른 채 드래그 (FigJam 방식).
  - 정렬 스냅: 노드를 끌 때 다른 노드의 위·가운데·아래 / 왼쪽·가운데·오른쪽과 화면 기준 6px 안이면 맞춰 붙는다. 가이드선은 보이지 않는다. Shift를 누른 채 끌면 가로/세로 한 방향으로만 이동한다.
  - 되돌리기/다시 실행(버튼 + Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y): 이동·연결·그룹·삭제·추가만. 노드 이름·역할·아이콘 편집은 되돌리기 대상이 아니다.
  - 연결선 클릭 → 툴바 표시, 툴바 버튼은 hover만. 연결선 라벨 편집 없음. 선택한 연결선은 Delete/Backspace로 삭제.
  - Save & Next → 팝업 Loading 약 1.5초 → (Step 2 구현 전까지) Step 1로 복귀.
- Mapping Step 2 (노드 설명): Add 버튼·노드 편집(이동/연결/그룹/우클릭) 없음, 확대·축소·이동만. 노드 클릭 → 480px 드로어 + 그 노드를 드로어 왼쪽 보이는 영역 가운데로. 입력창에는 AI가 읽은 내용(data/mapping.ts), 못 읽은 항목은 Not identified + 빈 입력창. "Apply this to other nodes?" 체크한 노드는 선택 표시 + 화면에 모두 보이게, Save 시 같은 내용 적용 + 검토 완료(초록)로 셈 — X로 닫으면 검토 완료 아님. Save를 누르면 드로어가 닫힌다. 체크는 노드별로 마지막 Save 값을 기억하고, 저장 전에는 기본값(Stage 노드를 열면 Lobby와 자기 자신을 뺀 나머지 Stage 전부). Save & Next는 5/5 검토 후에만.
- Mapping Step 3 (검토·적용): 노드 아래 상태 줄. Stage 3만 빨강(끝 지점 Not identified, 후보 StarManager / StageCompleteHandler / Neither), 나머지 Ready to apply. 빨간 노드 Save → 3초 Checking… → 초록(또는 Leave this pending이면 주황). 빨강·확인 중이 있으면 Apply 불가.
- 단계 사이 로딩: Step 1→2, 2→3, Apply 모두 5초 (온보딩 팝업 Loading). 노드가 차례로 떠오르는 애니메이션은 Step 1 처음에만. Step 2부터는 노드가 그 자리에 바로 있고 팝업만 0.4초 뒤. Step 3 진입 시 모든 상태 줄이 Checking…에서 시작해 왼쪽부터 0.45초 간격으로 불 켜지듯 하나씩 초록(확인 안 된 노드만 빨강), 다 켜진 뒤 팝업. 드로어는 노드를 눌러야 열린다.
- Step 2·3 드로어 아래: Reset(Secondary 버튼) + Save. Reset = Step 2는 AI가 처음 채운 상태(Not identified 포함)+기본 체크, Step 3는 Step 3 처음 상태로. Save를 눌러야 확정.
- Step 2 Save 조건: Not identified 항목이 비어 있으면 Save 불가. 채워서 저장하면 그 항목은 더 이상 Not identified로 보이지 않는다.
- Step 3 Resolve card: 후보 / Neither / "Leave this pending"은 한 묶음 라디오(하나만 선택). Leave this pending은 카드 없이 "Not sure?" 옆에 동그라미 + 문구. 노드 상태 줄은 Figma 그대로 (틴트 + 위 구분선 + 안쪽 glow 16px). Checking… → 결과로 바뀔 때 한 번 반짝하며 켜진다.
- 드로어를 닫으면(Save·X) 노드 전체가 넓어진 화면 가운데로 다시 부드럽게 이동한다 (1배율).
- 매핑 셋업 팝업의 "Just 3 steps!" 말풍선은 뒤가 비치지 않게(불투명) — 색은 Figma 그대로.
- 원칙: 항상 Figma 화면이 기본값. 디자이너가 '빼 달라'고 하면 Figma 위에 덧붙인 것만 뺀다.
- Apply 후 "Your game is mapped!" 모달. Not now = 0 tracked 화면, Set up logging = Logging setup Step 1.
- 입력창·텍스트영역은 포커스해도 테두리/외곽선 변화 없이 깜빡이는 캐럿만 보인다 (모든 화면). 여백·간격 그대로 줄 수만 늘어난다. 드로어는 머리·발 고정, 가운데만 스크롤.
- 셋업 중 hover만 되고 동작 없음: AI Agent, 매핑 셋업 팝업의 외부 링크. 매핑 셋업 팝업의 Explore dashboard = Overview로 이동 (셋업 상태 유지 → 흐름 완료 전 Tracking으로 오면 팝업부터 다시).
- 매핑 셋업 팝업: BounceBounce 클릭 시 실제 팝업처럼 나타나는 전환. "Just 3 steps!" 말풍선은 팝업이 뜬 뒤 약 3초 후 표시.
- 온보딩 팝업 미디어는 GIF 버전. GIF 주소는 데이터로 넣고, 없으면 "GIF 320 × 180" 자리표시.
- 온보딩 팝업: Step 2/3은 Back + primary. X를 누르거나 내비게이션으로 나가면 scrim 위에 "Leave mapping setup?" 표시. Minimise는 제목 바로 접힘. Save & Next 후 준비될 때까지 Loading 표시.
- Step 3 = Review → Apply. 노드 상태 행: 빨강 "n item requires review" (Apply 막음), 주황 "n item pending" (`color/status/pending`, Apply 가능), 초록 "Ready to apply". Apply 후 노드는 "Mapped / Fully mapped"로 바뀐다.
- Step 3 드로어: AI 후보 이름을 라디오 옵션 + Neither로. 아래에 "Not sure? Leave this pending". Neither 선택 시 자유 입력 "How does play end here?" 펼침.
- 노드 에디터: 노드를 누르면 바로 집히고 그대로 끌어 이동한다 (연파랑 glow + 핸들 4개, 길게 누르기 없음). 다른 노드와 노드 면적의 1/3 이상 겹치면 그룹 대상 표시(점선)가 뜨고, 놓으면 그룹이 된다. 그룹 밖으로 끌면 가장자리의 그룹 테두리가 점선이 된다. 드래그 중 커넥터 미리보기는 연파랑, 연결 후 회색. 커넥터 툴바는 hover 시에만.

## Next.js 버전 주의
@AGENTS.md
