import { en, type Messages } from "./en";
import { ko } from "./ko";

export const messages = { en, ko } satisfies Record<string, Messages>;

export type Locale = keyof typeof messages;
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALES = Object.keys(messages) as Locale[];

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && value in messages;

/** 서버 코드(API 라우트 등)에서 사용 */
export function getMessages(locale: unknown): Messages {
  return messages[isLocale(locale) ? locale : DEFAULT_LOCALE];
}

export type { Messages };
