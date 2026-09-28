import type { Delta, MetricUnit } from "@/data/dashboard/types";
import type { Messages } from "@/lib/i18n/messages";

// 대시보드 숫자·날짜 표시. 값은 데이터, 문구·단위는 i18n.

export const formatNumber = (locale: string, value: number, decimals = 0) =>
  new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);

/** 차트 축 눈금: 천 단위 쉼표 없이 (Figma "2500") */
export const formatTick = (locale: string, value: number) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 1, useGrouping: false }).format(value);

/** "2025-09-15" → "Sep 15" */
export const formatDay = (locale: string, iso: string) =>
  new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/** 초 → "9m 42s" */
export function formatDuration(t: Messages, seconds: number) {
  const s = Math.round(seconds);
  return t.dashboard.format.duration(Math.floor(s / 60), s % 60);
}

/** 단위가 붙은 값 ("1,214 users", "19.9 min", "42.6%") */
export function formatUnit(t: Messages, locale: string, unit: MetricUnit, value: number, decimals: number) {
  return t.dashboard.units[unit](formatNumber(locale, value, decimals));
}

/** 증감 칩 글자 ("8.2%", "8.2pp", "38s", "0.8") */
export function formatDelta(t: Messages, locale: string, delta: Delta) {
  switch (delta.unit) {
    case "percent":
      return t.dashboard.units.percent(formatNumber(locale, delta.value, 1));
    case "pp":
      return t.dashboard.format.pp(formatNumber(locale, delta.value, 1));
    case "seconds":
      return t.dashboard.format.seconds(delta.value);
    case "count":
      return formatNumber(locale, delta.value, 1);
  }
}

export const formatPercent = (t: Messages, locale: string, value: number, decimals = 1) =>
  t.dashboard.units.percent(formatNumber(locale, value, decimals));
