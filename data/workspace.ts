import type { Platform, Project, ProjectRole, Studio, User } from "./types";

// UI 단계 값은 Figma "워크스페이스 (셋업 전)" 프레임 그대로.

const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

export const currentUser: User = {
  name: "Jacob Parker",
  role: "owner",
  avatar: asset("/images/avatar-jacob.webp"),
};

export const currentStudio: Studio = {
  name: "H2 Studio",
  thumbnail: asset("/images/studio-h2.png"),
};

// 대시보드가 생기면 Tower Escape / Lantern Harbor는 셋업 없이 바로 대시보드로 연결한다 (내부 확인용).
export const projects: Project[] = [
  { id: "bouncebounce", name: "Bounce Bounce", thumbnail: asset("/images/project-bouncebounce.png"), platform: "roblox", memberCount: 1, role: "owner", activity: { kind: "created" }, needsSetup: true },
  { id: "tower-escape", name: "Tower Escape", thumbnail: asset("/images/project-bouncebounce.png"), platform: "unity", memberCount: 3, role: "editor", activity: { kind: "updated", ago: { value: 1, unit: "day" } }, needsSetup: false },
  { id: "lantern-harbor", name: "Lantern Harbor", thumbnail: asset("/images/project-bouncebounce.png"), platform: "roblox", memberCount: 2, role: "editor", activity: { kind: "updated", ago: { value: 3, unit: "day" } }, needsSetup: false },
];

/**
 * 워크스페이스 (셋업 후 — 일주일 뒤라는 설정). Figma "워크스페이스 (셋업 후-1주일 뒤라는 설정)" 값.
 * 셋업 흐름(매핑 → 로깅 → Tracked)을 끝낸 뒤 워크스페이스로 오면 이 값으로 보인다.
 */
export const projectsAfterSetup: Project[] = projects.map((p) =>
  p.id === "bouncebounce"
    ? { ...p, memberCount: 3, activity: { kind: "created", ago: { value: 7, unit: "day" } }, needsSetup: false }
    : p.id === "tower-escape"
      ? { ...p, activity: { kind: "updated", ago: { value: 3, unit: "day" } } }
      : { ...p, activity: { kind: "updated", ago: { value: 2, unit: "hour" } } },
);

/** 프로젝트 멤버 (Figma `Popover / Project members`) */
export const projectMembers: { id: string; name: string; avatar: string; role: ProjectRole; isYou: boolean }[] = [
  { id: "jacob", name: "Jacob Parker", avatar: asset("/images/member-jacob.png"), role: "owner", isYou: true },
  { id: "jihyun", name: "Jihyun Kim", avatar: asset("/images/member-jihyun.png"), role: "editor", isYou: false },
  { id: "minseo", name: "Minseo Park", avatar: asset("/images/member-minseo.png"), role: "viewer", isYou: false },
];

export const findProject = (id: string) => projects.find((p) => p.id === id);

// 필터 드롭다운 옵션 순서 ("all" + 값). 라벨은 i18n.
export const platformFilterValues: (Platform | "all")[] = ["all", "roblox", "unity", "others"];
export const roleFilterValues: (ProjectRole | "all")[] = ["all", "owner", "editor", "viewer"];
