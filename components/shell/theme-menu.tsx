"use client";

import { useRef, useState, type ReactNode } from "react";
import { DarkModeIcon, DarkModeSmIcon, LightModeIcon, LightModeSmIcon, SystemIcon } from "@/components/icons";
import { MenuOption, MenuPanel } from "@/components/ui/menu";
import { useI18n } from "@/lib/i18n";
import { useTheme, type ThemePreference } from "@/lib/theme";
import { useDismiss } from "@/lib/use-dismiss";

const options: { value: ThemePreference; icon: ReactNode }[] = [
  { value: "light", icon: <LightModeSmIcon className="shrink-0" /> },
  { value: "dark", icon: <DarkModeSmIcon className="shrink-0" /> },
  { value: "system", icon: <SystemIcon className="shrink-0" /> },
];

// 상단 바 달/해 아이콘 → Figma `Theme menu` (Light / Dark / System).
// 아이콘은 실제 적용 테마를 따른다 (Dark = 달, Light = 해).
// 메뉴 위치: 상단 바 아래 8px, 아이콘 오른쪽 끝에 맞춤. 아이콘을 다시 누르거나 바깥을 누르면 닫힘.
export function ThemeMenu() {
  const { t } = useI18n();
  const { preference, theme, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  return (
    <div ref={ref} className="relative size-6">
      <button
        type="button"
        aria-label={t.topBar.theme}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="block size-6 text-icon-primary icon-hit"
      >
        {theme === "dark" ? <DarkModeIcon /> : <LightModeIcon />}
      </button>
      {open && (
        // 아이콘(상단 바 가운데 24px) 아래 16px이 상단 바 끝 → +8px
        <MenuPanel className="absolute top-[calc(100%+24px)] right-0">
          {options.map((option) => (
            <MenuOption
              key={option.value}
              selected={preference === option.value}
              onSelect={() => setPreference(option.value)}
              icon={option.icon}
              className="h-9 w-[200px] text-[15px] leading-normal"
            >
              {t.theme[option.value]}
            </MenuOption>
          ))}
        </MenuPanel>
      )}
    </div>
  );
}
