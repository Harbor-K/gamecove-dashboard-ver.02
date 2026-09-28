"use client";

import { useSyncExternalStore } from "react";
import { parseThemePreference, THEME_COOKIE, type ThemePreference } from "./theme-config";

export type { ThemePreference };
export type Theme = "light" | "dark";

const LIGHT_QUERY = "(prefers-color-scheme: light)";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const media = matchMedia(LIGHT_QUERY);
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

const getPreference = (): ThemePreference => parseThemePreference(document.documentElement.dataset.theme);

/** 실제로 보이는 테마 (System이면 OS 설정) */
const getTheme = (): Theme => {
  const p = getPreference();
  if (p === "system") return matchMedia(LIGHT_QUERY).matches ? "light" : "dark";
  return p;
};

export function setThemePreference(preference: ThemePreference) {
  document.documentElement.dataset.theme = preference;
  document.cookie = `${THEME_COOKIE}=${preference}; path=/; max-age=31536000; samesite=lax`;
}

export function useTheme() {
  const preference = useSyncExternalStore(subscribe, getPreference, () => "dark" as const);
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as const);
  return { preference, theme, setPreference: setThemePreference };
}
