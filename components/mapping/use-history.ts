"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { persist, readPersisted } from "@/lib/setup-store";

// 되돌리기/다시 실행. 이동·연결·그룹·삭제·추가만 기록한다 (노드 이름·역할·아이콘 편집은 기록하지 않음).
// 드래그처럼 여러 번 바뀌는 동작은 begin() → setLive() … → end()로 한 번만 기록한다.

type State<T> = { past: T[]; present: T; future: T[]; snapshot: T | null };
type Action<T> =
  | { type: "commit"; next: T }
  | { type: "live"; next: T | ((prev: T) => T) }
  | { type: "begin" }
  | { type: "end"; changed: boolean }
  | { type: "undo" }
  | { type: "redo" };

function reducer<T>(s: State<T>, a: Action<T>): State<T> {
  switch (a.type) {
    case "commit":
      return { ...s, past: [...s.past, s.present], present: a.next, future: [] };
    case "live":
      return { ...s, present: typeof a.next === "function" ? (a.next as (p: T) => T)(s.present) : a.next };
    case "begin":
      return { ...s, snapshot: s.present };
    case "end":
      if (!s.snapshot) return s;
      return a.changed
        ? { ...s, past: [...s.past, s.snapshot], future: [], snapshot: null }
        : { ...s, snapshot: null };
    case "undo":
      if (!s.past.length) return s;
      return { ...s, past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] };
    case "redo":
      if (!s.future.length) return s;
      return { ...s, past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) };
  }
}

/** persistKey를 주면 화면을 떠났다 돌아와도 그래프·되돌리기 기록이 남는다 */
export function useHistory<T>(initial: T, persistKey?: string) {
  const [state, dispatch] = useReducer(
    reducer<T>,
    null,
    () =>
      (persistKey && readPersisted<State<T>>(persistKey)) || { past: [], present: initial, future: [], snapshot: null },
  );
  useEffect(() => {
    if (persistKey) persist(persistKey, { ...state, snapshot: null });
  }, [persistKey, state]);

  const commit = useCallback((next: T) => dispatch({ type: "commit", next }), []);
  /** 기록하지 않고 바꾸기 (드래그 중) */
  const setLive = useCallback((next: T | ((prev: T) => T)) => dispatch({ type: "live", next }), []);
  const begin = useCallback(() => dispatch({ type: "begin" }), []);
  /** begin() 이후 바뀐 게 있으면 한 단계로 기록 */
  const end = useCallback((changed: boolean) => dispatch({ type: "end", changed }), []);
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  return useMemo(
    () => ({
      present: state.present,
      commit,
      setLive,
      begin,
      end,
      undo,
      redo,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
    }),
    [state.present, state.past.length, state.future.length, commit, setLive, begin, end, undo, redo],
  );
}
