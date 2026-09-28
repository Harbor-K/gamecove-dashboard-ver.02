"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDownXsIcon, LinkIcon } from "@/components/icons-dashboard";
import { CloseIcon } from "@/components/icons-mapping";
import type { ProjectRole } from "@/data/types";
import { useI18n } from "@/lib/i18n";
import { useDismiss } from "@/lib/use-dismiss";
import { toCssPx } from "@/lib/zoom";

type Member = { id: string; name: string; avatar: string; role: ProjectRole; isYou: boolean };

// Figma `Popover / Project members`: w420 p24 radius 16, 그림자 0 12 32.
// 내비 Project members 항목 옆에 뜬다. Copy link·Invite·역할 변경은 hover만 (동작 없음).
export function ProjectMembersPopover({ anchor, members, onClose }: { anchor: HTMLElement; members: Member[]; onClose: () => void }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  useDismiss(ref, true, onClose, anchor);
  const r = anchor.getBoundingClientRect();
  // 내비 오른쪽 끝에서 16 띄워서, 항목과 위를 맞춘다
  const navRight = anchor.closest("nav")?.getBoundingClientRect().right ?? r.right;

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={t.projectMembers.title}
      className="fixed z-50 flex w-[420px] flex-col rounded-lg bg-bg-surface p-6 inset-ring inset-ring-border-default shadow-[0_12px_32px_0_var(--gc-effect-shadow)]"
      style={{ top: toCssPx(r.top), left: toCssPx(navRight) + 16, animation: "gc-pop-in 200ms cubic-bezier(0.2,0.8,0.2,1) both" }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] leading-[1.5] font-semibold text-text-primary">{t.projectMembers.title}</h2>
        <div className="flex items-center gap-4">
          <button type="button" className="flex items-center gap-2 text-label-default text-text-accent cursor-pointer hover:underline">
            <LinkIcon className="shrink-0 text-icon-ai" />
            {t.projectMembers.copyLink}
          </button>
          <button
            type="button"
            aria-label={t.projectMembers.close}
            onClick={onClose}
            className="flex size-5 items-center justify-center text-icon-secondary icon-hit cursor-pointer hover:text-icon-primary"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 py-4">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.projectMembers.invitePlaceholder}
          className="h-control-40 min-w-0 flex-1 rounded-md bg-bg-canvas px-3 text-label-default text-text-primary caret-text-primary outline-none inset-ring inset-ring-border-default placeholder:text-text-secondary focus-visible:outline-none"
        />
        <button
          type="button"
          className="flex h-control-40 items-center justify-center rounded-md bg-bg-subtle px-4 text-label-default text-text-secondary cursor-pointer hover:bg-bg-hover hover:text-text-primary"
        >
          {t.projectMembers.invite}
        </button>
      </div>
      <div className="h-px w-full bg-border-default" />
      <div className="flex flex-col gap-1 pt-4">
        {members.map((m) => (
          <div key={m.id} className="flex h-control-40 items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative size-7 shrink-0 overflow-hidden rounded-full">
                <Image src={m.avatar} alt="" fill sizes="28px" className="object-cover" />
              </span>
              <span className="flex items-center gap-2">
                <span className="text-fs-16 leading-[1.6] text-text-primary">{m.name}</span>
                {m.isYou && <span className="text-label-default text-text-secondary">{t.projectMembers.you}</span>}
              </span>
            </div>
            {m.role === "owner" ? (
              <span className="text-fs-16 leading-[1.6] text-text-secondary">{t.role[m.role]}</span>
            ) : (
              <button
                type="button"
                aria-label={t.projectMembers.changeRole(m.name)}
                className="flex items-center gap-2 text-fs-16 leading-[1.6] text-text-primary cursor-pointer hover:text-text-primary"
              >
                {t.role[m.role]}
                <ChevronDownXsIcon className="shrink-0 text-icon-secondary" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
