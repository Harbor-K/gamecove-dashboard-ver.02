"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";

// 셋업(매핑·로깅) 진행 상태를 화면 이동에도 남겨두는 저장소.
// 내비로 다른 페이지(대시보드·워크스페이스)에 갔다가 Tracking으로 돌아오면 직전 단계부터 이어서 한다.
// 앱 안 이동 동안만 유지된다 (새로고침하면 처음부터 — UT 시작 상태).
const store = new Map<string, unknown>();

export function readPersisted<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function persist(key: string, value: unknown) {
  store.set(key, value);
}

/** useState와 같지만 컴포넌트가 사라져도 값이 남는다 */
export function usePersistentState<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() =>
    store.has(key) ? (store.get(key) as T) : typeof initial === "function" ? (initial as () => T)() : initial,
  );
  useEffect(() => {
    store.set(key, value);
  }, [key, value]);
  return [value, setValue];
}

const listeners = new Map<string, Set<() => void>>();

/**
 * usePersistentState와 같지만 같은 key를 쓰는 모든 컴포넌트가 값을 함께 본다
 * (예: 페이지 필터 바와 지표 카드들, Exit rate와 Session flow의 카드 필터)
 */
export function useSharedState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const subscribe = useCallback(
    (fn: () => void) => {
      const set = listeners.get(key) ?? new Set();
      set.add(fn);
      listeners.set(key, set);
      return () => set.delete(fn);
    },
    [key],
  );
  const read = () => (store.has(key) ? (store.get(key) as T) : initial);
  const value = useSyncExternalStore(subscribe, read, () => initial);
  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (next) => {
      const prev = store.has(key) ? (store.get(key) as T) : initial;
      store.set(key, typeof next === "function" ? (next as (p: T) => T)(prev) : next);
      listeners.get(key)?.forEach((fn) => fn());
    },
    // initial은 key마다 고정값이라 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, setValue];
}

/** 셋업 흐름 전체(매핑 → 로깅 → Tracked)를 끝냈는지 — 워크스페이스(셋업 후)·프로젝트 기본 화면에 쓴다 */
export const SETUP_PHASE_KEY = "setup:phase";
export const isSetupComplete = () => readPersisted<string>(SETUP_PHASE_KEY) === "tracked";
