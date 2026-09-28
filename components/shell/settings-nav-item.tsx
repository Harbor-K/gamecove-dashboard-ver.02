"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SettingsIcon } from "@/components/icons";
import { DropdownOption, DropdownPanel, DropdownSectionTitle } from "@/components/dashboard/ui";
import { LOCALES } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n";
import { toCssPx } from "@/lib/zoom";
import { NavItem } from "./nav-item";

// 내비 Setting → 설정 메뉴 (Figma 없음, 내부 확인용). 지금은 Language > English / 한국어만.
// 내비 오른쪽 16에 뜨고, 아래 끝을 Setting 항목 아래 끝에 맞춘다. 셋업 중에도 이동이 없으므로 guard 없이 연다.
export function SettingsNavItem({ labelTone }: { labelTone?: "primary" | "secondary" }) {
  const { t, locale, setLocale } = useI18n();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const close = () => setAnchor(null);
  // 바깥 클릭·Esc로 닫기 (Setting 항목 자체 클릭은 토글이 처리)
  useEffect(() => {
    if (!anchor) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!ref.current?.contains(target) && !anchor.contains(target)) setAnchor(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAnchor(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [anchor]);

  const r = anchor?.getBoundingClientRect();
  const navRight = anchor?.closest("nav")?.getBoundingClientRect().right ?? r?.right ?? 0;

  return (
    <>
      <NavItem
        icon={<SettingsIcon />}
        label={t.nav.setting}
        labelTone={labelTone}
        ariaExpanded={anchor !== null}
        onClick={(e) => {
          const el = e.currentTarget;
          setAnchor((a) => (a ? null : el));
        }}
      />
      {anchor &&
        r &&
        createPortal(
          <div
            ref={ref}
            className="fixed z-50"
            style={{
              bottom: toCssPx(window.innerHeight - r.bottom),
              left: toCssPx(navRight) + 16,
              animation: "gc-pop-in 200ms cubic-bezier(0.2,0.8,0.2,1) both",
            }}
          >
            <DropdownPanel className="w-[220px]" shadow="lg">
              <DropdownSectionTitle>{t.settings.language}</DropdownSectionTitle>
              {LOCALES.map((l) => (
                <DropdownOption
                  key={l}
                  state={l === locale ? "selected" : "default"}
                  onClick={() => {
                    setLocale(l);
                    close();
                  }}
                >
                  {t.settings.languages[l]}
                </DropdownOption>
              ))}
            </DropdownPanel>
          </div>,
          document.body,
        )}
    </>
  );
}
