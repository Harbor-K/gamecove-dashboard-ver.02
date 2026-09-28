import { StudioMembersView } from "@/components/studio/studio-members-view";
import { members, pendingInvites } from "@/data/studio-members";

export default function StudioMembersPage() {
  return <StudioMembersView members={members} invites={pendingInvites} />;
}
