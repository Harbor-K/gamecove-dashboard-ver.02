import type { Invite, Member } from "./types";

// UI 단계 값은 Figma "studio members" 프레임 그대로.

export const members: Member[] = [
  { id: "jacob", name: "Jacob Parker", avatar: "/images/member-jacob.png", studioRole: "owner", access: { kind: "all" } },
  { id: "jihyun", name: "Jihyun Kim", avatar: "/images/member-jihyun.png", access: { kind: "projects", projectCount: 3, editor: 2, viewer: 1 } },
  { id: "minseo", name: "Minseo Park", avatar: "/images/member-minseo.png", access: { kind: "projects", projectCount: 2, editor: 1, viewer: 1 } },
];

export const pendingInvites: Invite[] = [
  { id: "elena", name: "Elena Duarte", email: "elena@hnj.studio", sent: { value: 2, unit: "day" } },
  { id: "marcus", name: "Marcus Webb", email: "marcus@par.studio", sent: { value: 6, unit: "hour" } },
];
