"use client";

import type { ReactNode } from "react";
import type { Studio, User } from "@/data/types";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "./app-shell";
import { WorkspaceNav } from "./workspace-nav";

export function WorkspaceShell({ user, studio, children }: { user: User; studio: Studio; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <AppShell
      user={user}
      select={{ name: studio.name, thumbnail: studio.thumbnail, thumbnailBackdrop: true, ariaLabel: t.topBar.studioSelect }}
      nav={<WorkspaceNav />}
    >
      {children}
    </AppShell>
  );
}
