// 데이터에는 문장이 아니라 값만 둔다. 화면 문구는 lib/i18n에서 만든다.

export type Platform = "roblox" | "unity" | "others";
export type ProjectRole = "owner" | "editor" | "viewer";
export type StudioRole = "owner";

export type User = {
  name: string;
  role: StudioRole;
  avatar: string;
};

export type Studio = {
  name: string;
  thumbnail: string;
};

/** 카드 오른쪽 아래 활동 문구의 값. ago가 없으면 "Just created" */
export type ProjectActivity = { kind: "created" | "updated"; ago?: { value: number; unit: "hour" | "day" } };

export type Project = {
  id: string;
  name: string;
  /** 상단 바 프로젝트 선택에 쓰는 썸네일 */
  thumbnail: string;
  platform: Platform;
  memberCount: number;
  /** 현재 사용자의 이 프로젝트 권한 */
  role: ProjectRole;
  activity: ProjectActivity;
  /** true면 카드 클릭 시 셋업(매핑 → 로깅)부터 진행 (UT Task1) */
  needsSetup: boolean;
};

// ── Mapping 캔버스 ───────────────────────────────────────────────────────────
export type NodeIconKey = "door" | "flag" | "shop" | "players" | "trophy" | "portal" | "roblox" | "node";
export type HandleSide = "top" | "right" | "bottom" | "left";

export type MapNode = {
  id: string;
  /** 캔버스 좌표 (그룹 안에 있으면 그룹이 위치를 정한다) */
  x: number;
  y: number;
  title: string;
  role: string;
  icon: NodeIconKey;
};

export type Connector = {
  id: string;
  from: { nodeId: string; side: HandleSide };
  to: { nodeId: string; side: HandleSide };
  /** true면 노드 위치에 따라 연결 면을 자동으로 고른다 (AI가 만든 흐름). 사용자가 핸들로 이은 선은 고정. */
  auto?: boolean;
};

export type NodeGroup = {
  id: string;
  /** "Group n"의 n */
  number: number;
  x: number;
  y: number;
  nodeIds: string[];
};

export type MappingGraph = {
  nodes: MapNode[];
  connectors: Connector[];
  groups: NodeGroup[];
};

// ── Mapping Step 2·3: 노드 구조 설명 ─────────────────────────────────────────────
export type NodeFieldKey = "about" | "enter" | "ends" | "elements";

export type NodeField = {
  value: string;
  /** AI가 게임 스크립트에서 읽어냈는지 (false = Not identified, 입력창 비어 있음) */
  identified: boolean;
};

export type NodeDetails = Record<NodeFieldKey, NodeField>;

/** Step 3: 스크립트와 맞춰 보지 못한 항목과 AI가 찾은 후보 */
export type ScriptReview = {
  field: NodeFieldKey;
  candidates: string[];
};

export type NodeMappingStatus = "requiresReview" | "checking" | "pending" | "ready" | "fullyMapped";

// ── Logging setup (분석 선택 → 추적 항목 계산) ──────────────────────────────────
/** 매핑 구조(Lobby·Stage)의 id — 매핑 UI 내부 개념. 로깅 이벤트·속성 이름으로 노출하지 않는다 (캔버스 id와는 mappingNodes.canvasId로 잇는다) */
export type LoggingNodeId = "lobby" | "stage_1" | "stage_2" | "stage_3" | "stage_4";

export type LoggingNode = {
  id: LoggingNodeId;
  /** 캔버스(data/mapping.ts) 노드 id */
  canvasId: string;
  label: string;
  type: "lobby" | "stage";
};

export type AnalysisId =
  | "gameProgression"
  | "sessionExitLocations"
  | "failuresByStage"
  | "timeSpentByLocation"
  | "withinStageProgress"
  | "sessionFlow";

export type TrackingEventId =
  | "session_started"
  | "session_ended"
  | "lobby_entered"
  | "stage_entered"
  | "stage_completed"
  | "stage_exited"
  | "attempt_failed"
  | "star_collected";

/** 분석 칩 하나가 필요로 하는 이벤트 (라벨·설명은 i18n: t.logging.analysis[id]) */
export type AnalysisOption = {
  id: AnalysisId;
  targetNodeIds: LoggingNodeId[];
  ready: TrackingEventId[];
  requiresSetup: TrackingEventId[];
};

/** Observation(ready) = 매핑한 구조로 감지 / Instrumentation(requires_setup) = 게임 코드에 로깅 추가 */
export type TrackingItem = {
  id: TrackingEventId;
  status: "ready" | "requires_setup";
  /** 고유 속성만. 공통 속성(player_id 등)은 commonProperties */
  properties: string[];
  /** 이벤트 자체가 기록되는 노드. null = 노드와 무관 (세션 이벤트) */
  appliesTo: LoggingNodeId[] | null;
};

export type OnboardingMedia = {
  /** GIF 주소. null이면 자리표시 */
  src: string | null;
};

export type Member = {
  id: string;
  name: string;
  avatar: string;
  /** 스튜디오 역할 칩. 없으면 칩을 표시하지 않는다. */
  studioRole?: StudioRole;
  access:
    | { kind: "all" }
    | { kind: "projects"; projectCount: number; editor: number; viewer: number };
};

export type Invite = {
  id: string;
  name: string;
  email: string;
  sent: { value: number; unit: "hour" | "day" };
};
