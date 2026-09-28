"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@/data/types";
import { SideNav } from "./side-nav";
import { TopBar, type TopBarSelect } from "./top-bar";

// 내비게이션 동작
// - 기본: 열림 + 고정 (본문은 내비 폭만큼 밀림)
// - 내비 아이콘 클릭 → 왼쪽으로 닫혀 사라짐. 상단 바 왼쪽에 캐릭터만 남음.
//   캐릭터 hover → 내비 아이콘으로 바뀌고, 누르면 다시 고정.
// - 닫힌 상태에서 화면 맨 왼쪽 가장자리에 마우스 → 내비가 본문 위로 열림, 벗어나면 닫힘.
//   이때 내비 아이콘을 누르면 고정.
export function AppShell({
  user,
  select,
  nav,
  onAiAgent,
  overlay,
  children,
}: {
  user: User;
  select: TopBarSelect;
  /** 내비 내용 (워크스페이스 / 프로젝트) */
  nav: ReactNode;
  /** 상단 바 AI Agent. 없으면 hover만 */
  onAiAgent?: () => void;
  /** 본문 위에 뜨는 것 (AI Agent 패널) */
  overlay?: ReactNode;
  children: ReactNode;
}) {
  const [pinned, setPinned] = useState(true);
  const [peek, setPeek] = useState(false);
  const visible = pinned || peek;

  // 본문 영역 왼쪽 끝 — 본문 가운데 모달·넓은 AI Agent 패널이 쓴다
  useEffect(() => {
    document.documentElement.style.setProperty("--gc-content-left", pinned ? "var(--spacing-sidebar)" : "0px");
  }, [pinned]);

  return (
    <div className="flex min-h-[calc(100vh/var(--gc-zoom))] w-full">
      {/* 고정 상태에서 본문을 내비 폭만큼 민다 */}
      <div aria-hidden className={`shrink-0 transition-[width] duration-200 ease-out ${pinned ? "w-sidebar" : "w-0"}`} />

      <SideNav
        user={user}
        visible={visible}
        pinned={pinned}
        onToggle={() => {
          setPinned(!pinned);
          setPeek(false);
        }}
        onMouseLeave={() => setPeek(false)}
      >
        {nav}
      </SideNav>

      {!visible && (
        <div aria-hidden className="fixed top-0 left-0 z-30 h-[calc(100vh/var(--gc-zoom))] w-2" onMouseEnter={() => setPeek(true)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar select={select} navCollapsed={!pinned} onExpandNav={() => setPinned(true)} onAiAgent={onAiAgent} />
        {/* 오른쪽 패널(AI Agent·필터 드로어)이 떠 있으면 그만큼 본문이 옆으로 밀린다 */}
        <main
          className="@container flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-out"
          style={{ paddingRight: "var(--gc-right-inset, 0px)" }}
        >
          {children}
        </main>
        {overlay}
      </div>
    </div>
  );
}
