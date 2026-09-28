"use client";

import { useEffect } from "react";

// 오른쪽에 붙는 패널(AI Agent, 필터 드로어)만큼 본문을 옆으로 밀어낸다.
// 여러 패널이 동시에 떠 있으면 가장 넓은 값. AppShell의 본문이 --gc-right-inset만큼 오른쪽 여백을 둔다.
const insets = new Map<string, number>();

function apply() {
  const max = Math.max(0, ...insets.values());
  document.documentElement.style.setProperty("--gc-right-inset", `${max}px`);
}

export function useRightInset(key: string, px: number) {
  useEffect(() => {
    insets.set(key, px);
    apply();
    return () => {
      insets.delete(key);
      apply();
    };
  }, [key, px]);
}
