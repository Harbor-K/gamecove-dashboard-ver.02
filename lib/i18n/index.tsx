"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_LOCALE, isLocale, messages, type Locale, type Messages } from "./messages";

// 언어는 URL query `?lang=en|ko`에 둔다. 기본 영어. 내비 Setting > Language에서 바꾸면 setLocale()이 주소의 lang을 고친다.
// 내부 링크는 href()로 lang을 유지한다.
export const LOCALE_PARAM = "lang";

type I18nContextValue = {
  locale: Locale;
  t: Messages;
  /** 내부 링크에 현재 lang을 유지해 붙인다. */
  href: (path: string) => string;
  /** 현재 주소의 lang을 바꾼다 (페이지 이동 없음) */
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const LOCALE_EVENT = "gc-locale-change";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(LOCALE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(LOCALE_EVENT, onChange);
  };
}

function setLocale(next: Locale) {
  const url = new URL(window.location.href);
  if (next === DEFAULT_LOCALE) url.searchParams.delete(LOCALE_PARAM);
  else url.searchParams.set(LOCALE_PARAM, next);
  // Next 라우터와 동기화되는 history.replaceState (새로고침·이동 없음)
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new Event(LOCALE_EVENT));
}

const getUrlLocale = () => new URLSearchParams(window.location.search).get(LOCALE_PARAM);

export function I18nProvider({ children }: { children: ReactNode }) {
  // 서버 HTML은 기본 언어로 그리고, hydration 직후 URL 값으로 바꾼다.
  const param = useSyncExternalStore(subscribe, getUrlLocale, () => null);
  const locale: Locale = isLocale(param) ? param : DEFAULT_LOCALE;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const href = (path: string) =>
    locale === DEFAULT_LOCALE ? path : `${path}${path.includes("?") ? "&" : "?"}${LOCALE_PARAM}=${locale}`;

  return <I18nContext.Provider value={{ locale, t: messages[locale], href, setLocale }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
