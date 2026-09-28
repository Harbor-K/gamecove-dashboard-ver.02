"use client";

import tokens from "@/tokens/figma-tokens.json";
import { useI18n } from "@/lib/i18n";
import { ThemeSwitch } from "./theme-switch";

// 개발용: Figma 토큰이 제대로 들어왔는지 두 테마에서 확인하는 페이지.
// 토큰·스타일 이름은 식별자라 번역하지 않는다.

const slug = (name: string) => name.replace(/^color\//, "").replaceAll("/", "-");

const groups = Object.keys(tokens.semantic).reduce<Record<string, string[]>>(
  (acc, name) => {
    const group = name.split("/").slice(0, -1).join("/");
    (acc[group] ??= []).push(name);
    return acc;
  },
  {},
);

const textStyles: { name: string; className: string }[] = [
  { name: "Display/Page", className: "text-display-page" },
  { name: "Display/Metric", className: "text-display-metric" },
  { name: "정량지표 숫자", className: "text-metric-number" },
  { name: "지표 카드 타이틀", className: "text-metric-card-title" },
  { name: "Title/Card", className: "text-title-card" },
  { name: "Body/Default", className: "text-body-default" },
  { name: "Label/Default", className: "text-label-default" },
  { name: "Caption/Default", className: "text-caption-default" },
];

export default function TokensPage() {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-8 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-display-page">{t.dev.tokens}</h1>
        <ThemeSwitch />
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-title-card">{t.dev.typography}</h2>
        <p className="font-logo text-title-card">GameCove (Ubuntu Regular)</p>
        {textStyles.map((s) => (
          <div key={s.name} className="flex items-baseline gap-6">
            <span className="w-40 shrink-0 text-caption-default text-text-secondary">
              {s.name}
            </span>
            <span className={s.className}>{t.dev.sampleText}</span>
          </div>
        ))}
        <div className="flex items-baseline gap-6">
          <span className="w-40 shrink-0 text-caption-default text-text-secondary">
            {t.dev.labelWeights}
          </span>
          <span className="text-label-default">Regular 400</span>
          <span className="text-label-default font-medium">Medium 500</span>
          <span className="text-label-default font-semibold">SemiBold 600</span>
          <span className="text-label-default font-bold">Bold 700</span>
        </div>
      </section>

      {Object.entries(groups).map(([group, names]) => (
        <section key={group} className="flex flex-col gap-4">
          <h2 className="text-title-card">{group}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {names.map((name) => (
              <div
                key={name}
                className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-surface p-3"
              >
                <div
                  className="h-12 rounded-sm border border-border-default"
                  style={{ background: `var(--gc-${slug(name)})` }}
                />
                <span className="text-caption-default break-all">{name}</span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="flex flex-col gap-4">
        <h2 className="text-title-card">chart/area gradient</h2>
        <div
          className="h-32 rounded-md border border-border-default"
          style={{
            background:
              "linear-gradient(to bottom, var(--gc-chart-area-primary-0), var(--gc-chart-area-primary-1), var(--gc-chart-area-primary-2), var(--gc-chart-area-primary-3), var(--gc-chart-area-primary-4))",
          }}
        />
      </section>
    </main>
  );
}
