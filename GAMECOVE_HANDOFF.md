# GameCove — 개발 핸드오프

UT(사용성 테스트)용 프로토타입. Figma 디자인을 Next.js로 옮기고 BounceBounce 합성 더미데이터를 연결한 상태에서 넘긴다.
이 문서에는 secret(API 키·토큰) 값이 없다. 프로젝트 규칙 전체는 `CLAUDE.md`(디자인·인터랙션·데이터 규칙), Next.js 버전 주의는 `AGENTS.md`.

---

## 1. 저장소
- GitHub: **whdhrrk/GameCove** (비공개) — https://github.com/whdhrrk/GameCove

## 2. 기준 branch
- `main` (push하면 Vercel이 자동 배포)

## 3. 최종 commit
- 코드·데이터 기준 commit: **`9cdb968`** (Day 8 확장까지 포함)
- 이 문서를 추가한 commit이 그 바로 다음 commit이다 (`git log -2`로 확인).

## 4. 이번 작업(더미데이터 연결 ~ Day 8)에서 추가/수정한 파일
기준: `9b1bc29`(데이터 연결 전) → 현재. `git diff --name-status 9b1bc29 HEAD`로 전체 확인 가능.

**추가**
- `data/source/BounceBounce_DummyData_v6_day8.xlsx` — 더미데이터 원본 (source of truth)
- `data/dashboard/bounce-bounce.json` — 원본을 정규화한 앱용 데이터 (생성 파일)
- `scripts/build-dashboard-data.mjs` — xlsx → json 정규화
- `scripts/check-dashboard-data.ts` — 조회 함수 결과를 Excel Summary와 대조
- `scripts/extend-day8.mjs` — v5(Day 1~7) → v6(+Day 8) 생성
- `scripts/verify-day8.mjs` — Day 1~7 불변 + Day 8 패턴 검증
- `components/shell/settings-nav-item.tsx` — 내비 Setting > Language
- `app/breakdown-colors.css`, `lib/dashboard/breakdown-colors.ts` — Breakdown 공통 색 (데이터 연결 직전 commit)
- `GAMECOVE_HANDOFF.md` — 이 문서

**수정**
- 데이터·계산: `data/dashboard/types.ts`, `data/dashboard/dataset.ts`, `lib/dashboard/queries.ts`, `lib/ai/mock.ts`
- 화면: `components/dashboard/{cards,line-chart,metric-cards,overview-parts,page-chrome,pages}.tsx`, `components/agent/agent-provider.tsx`, `components/mapping/{game-connected-modal,mapping-canvas,mapping-setup}.tsx`, `components/shell/{project-nav,workspace-nav,project-members-popover}.tsx`, `components/workspace/workspace-view.tsx`
- 라우트: `app/layout.tsx`, `app/projects/[projectId]/{overview,engagement,retention,explore}/page.tsx`
- 공통: `lib/i18n/{index.tsx,messages/en.ts,messages/index.ts}`, `lib/setup-store.ts`, `lib/theme-config.ts`, `lib/use-dismiss.ts`, `app/globals.css`
- 설정·문서: `package.json`, `package-lock.json`, `CLAUDE.md`

## 5. 기술 스택 · 실행 명령
- Next.js **16.3.6** (App Router, Turbopack) + React 19 + TypeScript + Tailwind CSS v4, 차트 recharts 3
- 이 Next.js는 학습 데이터와 API가 다르다 → 코드 작성 전 `node_modules/next/dist/docs/` 확인 (`AGENTS.md`)

| 명령 | 내용 |
|---|---|
| `npm install` | 의존성 설치 |
| `npm run dev` | 개발 서버 (http://localhost:3000) |
| `npm run build` / `npm start` | 프로덕션 빌드 / 실행 |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | 타입 검사 |
| `npm run tokens` | Figma 토큰 → `app/tokens.css` |
| `npm run data` | xlsx(v6) → `data/dashboard/bounce-bounce.json` |
| `npm run data:check` | 조회 함수 ↔ Excel Summary 대조 (현재 182 PASS) |
| `npm run data:day8` | v5 → v6 재생성 (v5 파일 경로를 인자로. 고정 seed라 결과 동일) |
| `npm run data:verify` | v5 ↔ v6 비교 (Day 1~7 불변, Day 8 패턴) |

`data:day8`·`data:verify`는 v5 원본 경로가 필요하다(기본값은 디자이너 PC 경로 `C:/Users/123/Desktop/BounceBounce_DummyData_v5_final.xlsx`, 저장소에 없음). v6만 있으면 앱·`data`·`data:check`는 동작한다.

## 6. 폴더 구조
| 경로 | 역할 |
|---|---|
| `app/` | 라우트. `(app)/` 워크스페이스·Studio members, `projects/[projectId]/` 프로젝트(overview·engagement·retention·experience·explore·tracking), `api/ai/*` AI 서버 라우트, `tokens/` 토큰 미리보기(개발용) |
| `components/dashboard/` | 대시보드: `cards.tsx`(재사용 카드), `metric-cards.tsx`(조회 함수 ↔ 카드 연결), `pages.tsx`(페이지 조립), `page-chrome.tsx`(페이지 머리·필터 바·필터 드로어), `overview-parts.tsx`(AI 브리핑·KPI), `line-chart.tsx`, `ui.tsx` |
| `components/agent/` | AI Agent(Ask COVY) 패널과 상태 |
| `components/mapping/`, `components/logging/`, `components/setup/` | Tracking: 매핑 셋업(Step 1~3), 로깅 셋업, 공용 드로어·온보딩 팝업·Leave 모달 (모두 시뮬레이션) |
| `components/shell/` | 앱 틀: 상단 바, 내비, 셋업 중 이동 막기(nav-guard), Setting 메뉴 |
| `components/workspace/`, `components/studio/`, `components/ui/` | 워크스페이스·Studio members 화면, 공용 UI |
| `data/` | 화면용 데이터: `workspace.ts`, `studio-members.ts`, `mapping.ts`, `logging.ts`, `dashboard/`(더미 dataset), `source/`(원본 xlsx) |
| `lib/dashboard/` | `queries.ts`(지표 계산), `format.ts`(숫자·날짜 표시), `breakdown-colors.ts` |
| `lib/ai/` | AI 층: `service.ts`(서버 진입점), `mock.ts`(더미 응답), `client.ts`(브라우저 호출), `context.ts`(공통 타입) |
| `lib/i18n/` | 문구 (`messages/en.ts`, `ko.ts`) + `useI18n()` |
| `lib/` 기타 | `setup-store.ts`(화면 간 유지 상태), `logging-setup.ts`, `theme*.ts`, `zoom.ts`(0.9 배율 좌표 보정), `right-inset.ts`, `use-dismiss.ts` |
| `tokens/` | Figma 토큰 원본 JSON |
| `scripts/` | 토큰·데이터 빌드/검증 스크립트 |

## 7. 더미데이터 위치
- 원본: `data/source/BounceBounce_DummyData_v6_day8.xlsx`
- 앱이 읽는 파일: `data/dashboard/bounce-bounce.json` (← `npm run data`)
- 로더·기본값: `data/dashboard/dataset.ts`, 타입: `data/dashboard/types.ts`

## 8. 더미데이터 구성
**xlsx 시트** (원본 README 시트에 시나리오·문제 A/B/C 설명이 있다 — 반드시 읽을 것)

| 시트 | grain / 역할 |
|---|---|
| `Players` | 1행 = 플레이어 961명. 기기·국가(`country_filter` = US/CA/BR/MX/GB/KR/Other)·유입 경로(합성)·Cove 이전 진행도(`*_before_cove`)·기간 누적 |
| `Sessions` | 1행 = 세션 1,843개. 시작/종료·길이·visit_type·첫 세션 여부·종료 위치 |
| `StageRuns` | 1행 = Stage 진입 1회 3,133개. 결과(Completed / Return lobby / Quit game)·시도·실패·별·replay |
| `Events` | 1행 = 이벤트 41,977개. session_started / lobby_entered / stage_entered / attempt_failed / star_collected / stage_completed / stage_exited / session_ended 등 |
| `MapSpec` | 게임 구조: Lobby + Stage 1~4, 각 O1~O8 + Goal, 별 개수 |
| `Event_Dictionary` | 이벤트 정의, 관측형 vs 코드수정형 |
| `Daily_Summary` | 일별 요약 (Day 1~8) |
| `Stage_Summary`, `Zone_Summary`, `Play_Start_Funnel`, `Metric_Definitions` | 검증·빠른 조회용 요약 — **Day 1~7 기준** |
| `Validation`, `Change_Log`, `README` | 검증 결과(v6 행 포함), 변경 기록(V6-01~04), 설명 |

**json (`BounceBounceDataset`)**
- `players[]`: id, firstSeenDate, device, country, countryFilter, acquisitionSourceSynthetic(원본), acquisitionSourceUi(화면용 5종, player_id 해시로 고정 매핑), highestStageClearedBeforeCove, furthestStageReachedBeforeCove
- `sessions[]`: id, playerId, date, startedAt/endedAt, durationSec, device, countryFilter, visitType, isFirstSession, exitArea, path(Lobby/Stage 방문 순서)
- `stageRuns[]`: id, sessionId, playerId, stage, enteredAt/endedAt, durationSec, result, attempts, failures, starsCollected/Required, isReplay, device, countryFilter, visitType
- `meta`: dataStart(9/15), periodStart~periodEnd(9/15~21 = Last 7 days), today(9/22), dataThrough(9/22 21:45), dates(기간), allDates(9/15~22)

## 9. KPI·차트 계산 위치
- **`lib/dashboard/queries.ts`** — 모든 지표. 필터 객체(`DashboardFilters`)를 받는다.
  - Engagement: `getDailyActiveUsers`, `getPlaytime`, `getSessions`, `getAverageSessionTime`, `getNewReturning`, `getTrafficSources`
  - Retention: `getRetention`(D1/D7), `getDateCohorts`, `getProgressionCohorts`
  - Experience: `getExitRate`, `getSessionFlow`, `getStageProgression`, `getNewUserProgression`
  - Overview: `getOverviewKpis` (Today vs previous 7 days)
  - 공통: `resolveBreakdown`, `funnelRows`, `heatOpacity`, `niceAxisMax`
- 표시 형식: `lib/dashboard/format.ts`. 지표 정의·툴팁 문구: `lib/i18n/messages/en.ts`의 `dashboard.info`.

## 10. 데이터 → 화면 흐름
1. **raw**: `data/source/*.xlsx` → `scripts/build-dashboard-data.mjs`(정규화) → `data/dashboard/bounce-bounce.json` → `data/dashboard/dataset.ts`(`dataset`, `dashboardDefaults`, `filterOptions`, `overviewKpiTargets`)
2. **계산**: `lib/dashboard/queries.ts`가 `dataset`의 raw 행에서 매번 계산 (Summary 시트 값을 가져오지 않는다). 브라우저에서 실행된다(데이터 전체가 클라이언트 번들에 포함).
3. **컴포넌트**: `components/dashboard/metric-cards.tsx`가 필터 범위(`FilterScopeProvider` + `useMetricFilters`)를 정해 query를 부르고, 결과를 `cards.tsx`의 재사용 카드에 props로 넘긴다 → `pages.tsx`가 페이지로 조립 → `app/projects/[projectId]/*/page.tsx`
   - 필터 범위: Engagement·Retention = 페이지 필터 + Breakdown / Explore = 페이지 필터만 / Overview·Experience = 페이지 필터 없음(카드 안 Filter by만). 카드 필터는 그 카드에만 AND.
   - 페이지 필터 상태: `useDashboardFilters()` (`lib/setup-store.ts`의 `useSharedState`, 메모리 — 새로고침하면 초기화)
   - Overview AI 브리핑은 빌드 때 서버에서 계산해 HTML에 넣는다 (`app/projects/[projectId]/overview/page.tsx`).

## 11. Day 8 추가 내용
- **유지(변경 없음)**: v5의 Sessions 1,643 · StageRuns 2,812 · Events 37,579 행, Daily_Summary Day 1~7 행, Stage/Zone/Funnel/Metric_Definitions 요약(Day 1~7 기준). `npm run data:verify`로 행 단위 동일 확인.
- **추가**: 2026-09-22 01:00~21:45(UTC) — 플레이어 53명(신규, P0990~P1042), 세션 200, Stage run 321, 이벤트 5,454, Daily_Summary Day 8 행, Validation(v6) 12행, Change_Log V6-01~04, README v6 3행.
- **갱신**: Players에서 Day 8에 활동한 기존 127명의 기간 누적 컬럼(`sessions_7d`, `active_days_7d`, `playtime_sec`, `payer_by_period_end`, `*_by_period_end`)만 Day 1~8 누적으로. 열 이름은 호환을 위해 그대로 둠.
- **생성 방법** (`scripts/extend-day8.mjs`, 고정 seed):
  - 재방문 여부: Day 1~7에서 관측된 전날→다음날 재방문 비율(가입 경과일·전날 접속·전날 Stage 4 완료·신규 첫날 진행도별)로 표본. Players 시트가 "7일 내 접속자"만 담아 비율이 과대(표본 편향)라, 비율 간 상대 차이는 유지하고 전체만 ×0.744 해서 재방문 추세(약 125명)에 맞춤.
  - 행동: 같은 누적 클리어 Stage·같은 기기의 실제 하루 기록(Day 2~7)을 복제해 시간만 Day 8로(±60분). 신규는 9/18~21 신규의 첫날 기록(속성 포함) 복제. 원본 template id를 `change_note` / `record_basis`에 남김.
- **결과**: DAU 232→…→184→**180**, 신규 53, 재방문 127. 문제 A(Stage 4 Mobile 67.0% < PC 87.0%), 문제 B(9/21 cohort D1 11.9%), 문제 C(Stage 4 완료자 재방문 7.5% < Stage 3 12.0%) 방향 유지. v6 구조 검증 12개 PASS.
- **계산 로직 변경** (필요해서 바꾼 것):
  1. 기간(Last 7 days) = Today 이전 완료된 7일(9/15~21). Today(9/22)는 Overview에서만. → Day 1~7 패턴이 그대로 보이고, Overview 비교의 previous 7 days와 같은 구간.
  2. 리텐션 관측 가능 기준: 기간 끝 → 데이터 마지막 날(Today). Today D1(9/21 cohort가 9/22에 돌아온 비율)을 계산하려면 필요. 그래서 기간 차트의 9/21 D1과 9/15 cohort D7(8.8%)이 새로 계산된다(부분 일자).
  3. 수집 시작(9/15) 이전 날짜의 cohort는 계산하지 않음 (첫날 기록이 없어 돌아온 사람만 남는 편향).
  4. Overview `comparison`: Today 값 vs previous 7 days 날짜별 값의 평균(D1은 cohort 9/15~20). DAU·신규·플레이 시간은 %, D1은 %p.

## 12. AI / Agent 현재 구현
- **서버 진입점** `lib/ai/service.ts`: `getRecommendedQuestions(context)`, `getBriefing(context)`, `askCovy(message, context)`. `LLM_PROVIDER`·`LLM_API_KEY`가 없으면 `lib/ai/mock.ts`, 있으면 `callProvider()` — **아직 미구현(throw)**. 여기만 채우면 된다.
- **mock** `lib/ai/mock.ts`: dataset을 실제로 계산해 문장을 만든다(숫자를 지어내지 않음). 추천 질문(지표 그룹별), 브리핑(신규 퍼널 최대 이탈), Ask COVY(짧고 모호한 질문이면 clarify, 아니면 exit/funnel/retention/engagement 요약 + 다음 단계 + 추천 질문). 문구는 i18n `aiMock`.
- **공통 context** `lib/ai/context.ts` `GameCoveContext`: page, metric, selection, filters, tracking(추적/대기 이벤트), locale. 응답 타입 `RecommendedQuestions` / `Briefing` / `CovyResponse`(clarify | answer: sections·followUps).
- **UI·상태**:
  - `components/agent/agent-provider.tsx`: 패널 open/expanded/width/thread/context. `ask()`가 사용자 turn + pending turn을 넣고 `/api/ai/covy` 응답으로 교체. `setOpenGuard`(필터 드로어의 "Apply filters?" 확인).
  - `components/agent/agent-panel.tsx`: 빈 화면(Covy + 시작 템플릿 3개), Clarify 옵션, Answer 섹션, composer, 넓게 보기·폭 조절. 셋업 진행 중에는 열리지 않는다(hover만).
  - Explore(`pages.tsx` `ExplorePage`): `fetchRecommendedQuestions`로 칩 표시 → 누르면 같은 context로 `agent.ask`.
  - Overview 브리핑(`overview-parts.tsx` `AiBriefing`): 빌드 때 계산한 값 사용, 누르면 해당 지표 Explore.
- **빈 곳**: 상단 바에서 연 Agent의 context는 `{ page, locale }`뿐(필터·지표 없음). `context.tracking`은 어디서도 채우지 않는다. No data / Not tracked / insufficient evidence 처리는 mock에 일부(`answer.noData`)만.

## 13. API 라우트
- `app/api/ai/recommended-questions/route.ts` — POST `{ context }` → `RecommendedQuestions`
- `app/api/ai/briefing/route.ts` — POST `{ context }` → `Briefing`
- `app/api/ai/covy/route.ts` — POST `{ message, context }` → `CovyResponse`
- 클라이언트 호출: `lib/ai/client.ts`. 오류 시 `{ error }` + 500.

## 14. 환경 변수 (이름만)
- `LLM_PROVIDER`, `LLM_API_KEY` — `.env.local`(로컬, git 제외)과 Vercel Project Settings → Environment Variables. **서버에서만 읽는다. `NEXT_PUBLIC_` 금지.** 템플릿: `.env.example`.

## 15. 미완성 기능
- 실제 LLM 연결 (`callProvider`), AI 하네싱(dataset 근거·추적 안 된 데이터 처리·근거 부족 응답)
- **한국어 번역**: `lib/i18n/messages/ko.ts`가 `en`을 그대로 씀 → Setting에서 한국어를 골라도 영어 문구 + 한글 폰트
- **Data hover tooltip**(차트 값 hover, D7 "No data to calculate yet" 포함) — 디자인 대기
- Information tooltip(ⓘ) 문구는 임시 (디자이너가 마지막에 교체)
- 대시보드 화면을 데이터 연결 후 Figma와 대조하는 최종 비교 미실시
- 막대·퍼널 카드의 Breakdown 표시는 구현돼 있지만 선택할 곳이 없다 (Experience에 페이지 필터 없음, Explore Breakdown 없음)

## 16. 알려진 문제 · 임시 처리
- Day 8은 부분 일자(21:45까지). Today vs previous 7 days는 부분 일자 vs 완료된 날의 비교다.
- 기간 카드(퍼널 KPI 등)의 비교값은 이전 기간 데이터가 없어 항상 "— No comparison data".
- 페이지 필터와 카드 필터가 같은 차원에서 겹치지 않으면 `__none__` 값으로 "결과 없음"을 표현 (`metric-cards.tsx` `NO_MATCH`).
- 데이터 전체(json 약 1.7MB)가 브라우저 번들에 포함된다. 첫 로딩이 조금 느릴 수 있다.
- Overview 브리핑은 빌드 시점에 고정. 데이터를 바꾸면 다시 빌드(배포)해야 반영.
- Explore는 주소로 바로 열면 본문이 hydration 이후에 그려진다(useSearchParams + Suspense).
- 셋업 진행 상태·필터는 메모리에만 있어 새로고침하면 처음부터 (UT 시작 상태 의도).
- xlsx(SheetJS 0.18.5)는 개발 스크립트에서만 쓰며 npm audit 경고가 있다. 앱 번들에는 없음.
- Players의 `*_7d` 열 이름은 이제 Day 1~8 누적 값을 담는다(Day 8 활동자).

## 17. UI만 있고 동작(backend) 없는 부분
- Tracking 전체: Roblox 연결, 스크립트 분석, 매핑·로깅 적용, Event Active 토글의 실제 효과, Delete event (모두 시뮬레이션)
- Date range Custom, Time interval(Days만), 페이지 ⋮(Export·Schedule report·Refresh data), 카드 ⋮(Download CSV 등)
- 내비 Live Ops · Feedback · Monetisation · Quality · Custom Board > Add Board(모달만), Reports · Data Sources
- Project members의 Copy link · Invite · 역할 변경, 상단 바 알림·도움말, 로그인·계정
- 매핑 셋업 팝업의 외부 링크, 매핑 완료 모달의 외부 링크

## 18. 배포
- Vercel(GitHub 연동). `main`에 push하면 자동 배포(1~2분).
- URL: **https://game-cove.vercel.app** (공개). `game-cove-xxxx-….vercel.app` 형태의 배포별 주소는 Vercel 로그인이 필요하다.
- 모든 페이지는 정적 prerender(빌드 결과 ●/○). `/api/ai/*`만 서버 함수.

## 19. 건드리지 않는 것이 좋은 것
- **Day 1~7 더미데이터와 그 패턴**(문제 A·B·C, DAU 감소 흐름, Stage 해금 규칙). 보완은 새 행/새 열로 하고 `data:check`·`data:verify`를 PASS로 유지.
- 지표 정의(D1 = 날짜별 평균, first-clear time = run 시간 합, Session flow = 첫 방문 다음 목적지 1개, player 기준 clear rate 등 — `CLAUDE.md` "대시보드 데이터" 절과 `dashboard.info` 문구).
- `app/tokens.css`(생성 파일 — `tokens/figma-tokens.json` 수정 후 `npm run tokens`), 시맨틱 토큰만 사용(hex·Tailwind 기본 팔레트 금지), 토큰에 알파가 이미 있으므로 `/NN` opacity modifier 금지.
- 전체 배율 `--gc-zoom: 0.9`: 마우스 좌표·`getBoundingClientRect`는 `lib/zoom.ts`의 `toCssPx`로 나누고, 100vh는 `calc(100vh/var(--gc-zoom))`.
- 정적 페이지 유지: 서버 컴포넌트에서 `cookies()`·`searchParams`를 읽지 않는다 (읽으면 모든 페이지가 요청마다 서버 렌더 → 전환이 느려짐). 테마는 `app/layout.tsx`의 beforeInteractive 스크립트.
- 하드코딩 금지: 값은 data/query, 문구는 `lib/i18n/messages/en.ts`(`Messages` 타입이 ko 누락을 막는다).
- API 키는 서버에서만.

## 20. 기타
- 문서: `CLAUDE.md`가 디자인·인터랙션·데이터 규칙의 기준이다(한국어). 디자이너 결정이 여기에 누적돼 있다.
- UT 동선: 워크스페이스(셋업 전) → BounceBounce → 매핑 셋업 → 로깅 셋업 → Tracked → Workspace → 대시보드. Tower Escape·Lantern Harbor는 셋업 없이 바로 대시보드(내부 확인용, 같은 dataset).
- 언어: URL `?lang=ko` 또는 내비 Setting > Language. 내부 링크는 `useI18n().href()`로 lang 유지.
- 테마: 상단 바 토글(Dark 기본), 쿠키 `gc-theme`.
- 검증 루틴: `npx tsc --noEmit` → `npm run lint` → `npm run data:check` → `npm run build`.
