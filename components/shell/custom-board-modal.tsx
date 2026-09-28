"use client";

import Image from "next/image";
import { useState } from "react";
import { PeopleIcon } from "@/components/icons";
import { ChevronRightXsIcon } from "@/components/icons-dashboard";
import { CloseIcon } from "@/components/icons-mapping";
import { Modal } from "@/components/ui/modal";
import type { ProjectRole } from "@/data/types";
import { useI18n } from "@/lib/i18n";

type Member = { id: string; name: string; avatar: string; role: ProjectRole; isYou: boolean };

// Figma `Modal / Create custom board` (빈 상태): w560 p32 radius 16, 그림자 0 16 48.
// Cancel / X / Esc = 닫기. Create board·멤버 선택은 hover만.
export function CustomBoardModal({ open, owner, onClose }: { open: boolean; owner: Member; onClose: () => void }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  return (
    <Modal open={open} contained onEscape={onClose} labelledBy="custom-board-title">
      <div className="flex w-[560px] flex-col rounded-lg bg-bg-surface p-8 inset-ring inset-ring-border-default shadow-[0_16px_48px_0_var(--gc-effect-shadow)]">
        <div className="flex items-center justify-between pb-6">
          <h2 id="custom-board-title" className="text-[20px] leading-[1.3] font-semibold text-text-primary">
            {t.customBoard.title}
          </h2>
          <button
            type="button"
            aria-label={t.customBoard.close}
            onClick={onClose}
            className="flex size-5 items-center justify-center text-icon-secondary icon-hit cursor-pointer hover:text-icon-primary"
          >
            <CloseIcon />
          </button>
        </div>
        <label className="flex flex-col gap-2 pb-6">
          <span className="text-label-default text-text-secondary">{t.customBoard.boardName}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-md bg-bg-canvas px-4 text-fs-16 leading-[1.6] text-text-primary caret-text-primary outline-none inset-ring inset-ring-border-default focus-visible:outline-none"
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-label-default text-text-secondary">{t.customBoard.whoHasAccess}</span>
          <div className="flex flex-col gap-1 pt-2">
            <button type="button" className="group flex h-12 items-center justify-between text-left cursor-pointer">
              <span className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center text-icon-primary">
                  <PeopleIcon />
                </span>
                <span className="text-fs-16 leading-[1.6] text-text-primary">{t.customBoard.chooseMembers}</span>
              </span>
              <ChevronRightXsIcon className="shrink-0 text-icon-secondary group-hover:text-icon-primary" />
            </button>
            <div className="flex h-12 items-center justify-between">
              <span className="flex items-center gap-3">
                <span className="relative size-7 shrink-0 overflow-hidden rounded-full">
                  <Image src={owner.avatar} alt="" fill sizes="28px" className="object-cover" />
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-fs-16 leading-[1.6] text-text-primary">{owner.name}</span>
                  <span className="text-label-default text-text-secondary">{t.projectMembers.you}</span>
                </span>
              </span>
              <span className="text-fs-16 leading-[1.5] text-text-secondary">{t.role[owner.role]}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-7">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 items-center rounded-md px-5 text-fs-16 leading-[1.5] text-text-primary inset-ring inset-ring-border-default cursor-pointer hover:bg-bg-hover"
          >
            {t.customBoard.cancel}
          </button>
          <button
            type="button"
            className="flex h-11 items-center rounded-md bg-bg-button-primary px-5 text-fs-16 leading-[1.5] font-semibold text-text-on-button-primary hover-layer"
          >
            {t.customBoard.create}
          </button>
        </div>
      </div>
    </Modal>
  );
}
