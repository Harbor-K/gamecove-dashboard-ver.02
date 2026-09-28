"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { askCovy } from "@/lib/ai/client";
import type { CovyResponse, GameCoveContext } from "@/lib/ai/context";

// AI Agent 상태 (UI와 AI 로직 분리). 패널은 이 상태만 그리고, 답은 askCovy(message, context)가 만든다.
// 시작 방법: 상단 바 AI Agent / Explore 추천 질문 / 시작 템플릿 / 직접 입력 — 모두 ask()로 모인다.

export type AgentTurn =
  | { role: "user"; text: string }
  | { role: "assistant"; status: "pending" }
  | { role: "assistant"; status: "done"; response: CovyResponse };

type AgentState = {
  open: boolean;
  expanded: boolean;
  /** 패널 폭 (왼쪽 가장자리를 끌어 조절) */
  width: number;
  thread: AgentTurn[];
  /** 대화가 붙어 있는 화면 (composer의 context 칩) */
  context: GameCoveContext | null;
};

type AgentControls = AgentState & {
  /** false면 셋업 중 — 버튼은 hover만, 열리지 않음 */
  enabled: boolean;
  toggle: () => void;
  close: () => void;
  setExpanded: (expanded: boolean) => void;
  setWidth: (width: number) => void;
  /**
   * 패널을 열기 전에 끼어들 곳 (예: 필터 드로어 — 적용 안 한 변경이 있으면 확인 모달 뒤 open()).
   * guard가 있으면 열 때 open 대신 guard(open)을 부른다. 해제는 null
   */
  setOpenGuard: (guard: ((open: () => void) => void) | null) => void;
  /** 질문을 보내고 패널을 연다 */
  ask: (message: string, context: GameCoveContext) => void;
};

/** 기본은 드로어 폭 (Figma Size=Panel 480) */
export const AGENT_DEFAULT_W = 480;

const AgentContext = createContext<AgentControls | null>(null);

export function useAgent() {
  const value = useContext(AgentContext);
  if (!value) throw new Error("useAgent must be used inside <AgentProvider>");
  return value;
}

export function AgentProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [state, setState] = useState<AgentState>({ open: false, expanded: false, width: AGENT_DEFAULT_W, thread: [], context: null });
  const guardRef = useRef<((open: () => void) => void) | null>(null);
  const setOpenGuard = useCallback((guard: ((open: () => void) => void) | null) => {
    guardRef.current = guard;
  }, []);

  const ask = useCallback((message: string, context: GameCoveContext) => {
    const text = message.trim();
    if (!text) return;
    setState((s) => ({
      ...s,
      open: true,
      context,
      thread: [...s.thread, { role: "user", text }, { role: "assistant", status: "pending" }],
    }));
    askCovy(text, context)
      .then((response) =>
        setState((s) => ({
          ...s,
          thread: s.thread.map((turn, i) =>
            i === s.thread.length - 1 && turn.role === "assistant" ? { role: "assistant", status: "done", response } : turn,
          ),
        })),
      )
      .catch(() => setState((s) => ({ ...s, thread: s.thread.slice(0, -1) })));
  }, []);

  const value = useMemo<AgentControls>(
    () => ({
      ...state,
      open: enabled && state.open,
      enabled,
      toggle: () => {
        if (!enabled) return;
        const open = () => setState((s) => ({ ...s, open: true }));
        if (state.open) setState((s) => ({ ...s, open: false }));
        else if (guardRef.current) guardRef.current(open);
        else open();
      },
      close: () => setState((s) => ({ ...s, open: false })),
      setExpanded: (expanded) => setState((s) => ({ ...s, expanded })),
      setWidth: (width) => setState((s) => ({ ...s, width })),
      setOpenGuard,
      ask,
    }),
    [state, enabled, ask, setOpenGuard],
  );

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}
