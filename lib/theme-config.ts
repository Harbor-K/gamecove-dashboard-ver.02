// 테마 선택값은 쿠키에 저장하고, app/layout.tsx의 인라인 스크립트가 첫 페인트 전에 <html data-theme>에 넣는다.
// data-theme = "dark" | "light" | "system". system이면 CSS가 prefers-color-scheme을 따른다.
export const THEME_COOKIE = "gc-theme";

export type ThemePreference = "light" | "dark" | "system";

export const parseThemePreference = (value: string | undefined): ThemePreference =>
  value === "light" || value === "system" ? value : "dark";
