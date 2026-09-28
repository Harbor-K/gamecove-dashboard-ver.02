"use client";

import { createContext, useContext } from "react";

// 셋업(매핑·로깅) 중 내비로 화면을 벗어나려 할 때 가로채는 장치.
// guard(action): 막혀 있지 않으면 action 실행, 막혀 있으면 Leave setup 모달을 띄운다.
export type NavGuard = { guard: (action?: () => void) => void };

export const NavGuardContext = createContext<NavGuard>({ guard: (action) => action?.() });

export const useNavGuard = () => useContext(NavGuardContext);
