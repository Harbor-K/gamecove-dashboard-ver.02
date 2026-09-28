"use client";

import Image from "next/image";
import { LinkChainIcon } from "@/components/icons";
import { Button, PillButton } from "@/components/ui/button";
import type { Invite, Member } from "@/data/types";
import { useI18n } from "@/lib/i18n";

// Figma "studio members" 본문: pt32 pb48 px48, gap56.
// Manage access / Invite / Accept 는 다음 화면이 없어서 hover만.
export function StudioMembersView({ members, invites }: { members: Member[]; invites: Invite[] }) {
  const { t } = useI18n();

  return (
    <div className="flex w-full flex-col gap-14 px-12 pt-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-display-page text-text-primary">{t.studioMembers.title}</h1>
        <p className="text-body-default text-text-secondary">{t.studioMembers.description}</p>
      </div>

      <div className="flex w-full flex-col gap-[76px]">
        <section className="flex w-full flex-col gap-8">
          <div className="flex w-full items-center gap-3">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <h2 className="text-display-metric text-text-primary">{t.studioMembers.members}</h2>
              <span className="text-fs-16 leading-[1.5] text-text-secondary">{members.length}</span>
            </div>
            <div className="h-px min-w-px flex-1" />
            <Button variant="secondary">{t.studioMembers.manageAccess}</Button>
            <Button variant="primary" icon={<LinkChainIcon />}>
              {t.studioMembers.invite}
            </Button>
          </div>

          <div className="flex w-full flex-col">
            <div className="flex w-full pb-2 text-label-default text-text-secondary">
              <span className="w-[464px] shrink-0">{t.studioMembers.columnMember}</span>
              <span>{t.studioMembers.columnProjectAccess}</span>
            </div>
            <div className="h-px w-full bg-border-default" />
            {members.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </div>
        </section>

        <section className="flex w-full flex-col gap-6">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <h2 className="text-[18px] leading-[1.2] font-bold text-text-primary">{t.studioMembers.pendingInvites}</h2>
            <span className="text-fs-16 leading-[1.5] text-text-secondary">{invites.length}</span>
          </div>
          <div className="flex w-full flex-col">
            <div className="h-px w-full bg-border-default" />
            {invites.map((invite) => (
              <div key={invite.id} className="flex h-[72px] w-full items-center">
                <div className="flex w-[464px] shrink-0 flex-col whitespace-nowrap">
                  <span className="text-body-default text-text-primary">{invite.name}</span>
                  <span className="text-caption-default text-text-secondary">
                    {t.studioMembers.inviteMeta(invite.email, t.time.ago(invite.sent.value, invite.sent.unit))}
                  </span>
                </div>
                <PillButton>{t.studioMembers.accept}</PillButton>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MemberRow({ member }: { member: Member }) {
  const { t } = useI18n();
  return (
    <div className="flex h-[76px] w-full items-center">
      <div className="flex h-7 w-[464px] shrink-0 items-center gap-3">
        <span className="relative size-7 shrink-0 overflow-hidden rounded-full">
          <Image src={member.avatar} alt="" fill sizes="28px" className="object-cover" />
        </span>
        <span className="text-body-default whitespace-nowrap text-text-primary">{member.name}</span>
        {member.studioRole && (
          <span className="flex h-6 items-center justify-center rounded-full inset-ring inset-ring-border-default px-2 text-caption-default whitespace-nowrap text-text-secondary">
            {t.role[member.studioRole]}
          </span>
        )}
      </div>
      {member.access.kind === "all" ? (
        <span className="text-label-default whitespace-nowrap text-text-secondary">{t.studioMembers.allProjects}</span>
      ) : (
        <div className="flex flex-col whitespace-nowrap">
          <span className="text-label-default text-text-accent">
            {t.studioMembers.projectCount(member.access.projectCount)}
          </span>
          <span className="text-caption-default text-text-secondary">
            {t.studioMembers.accessBreakdown(member.access.editor, member.access.viewer)}
          </span>
        </div>
      )}
    </div>
  );
}
