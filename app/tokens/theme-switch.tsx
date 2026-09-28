"use client";

import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

// 토큰 미리보기용 임시 스위치. 실제 토글은 상단 바의 Theme menu.
export function ThemeSwitch() {
  const { t } = useI18n();
  const { theme, setPreference } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setPreference(theme === "dark" ? "light" : "dark")}
      className="h-control-40 rounded-md border border-border-button-secondary bg-bg-button-secondary px-4 text-label-default font-semibold text-text-button-secondary cursor-pointer"
    >
      {t.dev.themeLabel(t.theme[theme])}
    </button>
  );
}
