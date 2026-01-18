import { getSessionFromCookie } from "@/lib/auth";
import { findUserById } from "@/lib/store";
import { Locale, resolveLocale } from "@/lib/text";

export const DEFAULT_LOCALE: Locale = "ru";

export function getUserLocale(): Locale {
  const session = getSessionFromCookie();
  if (!session) {
    return DEFAULT_LOCALE;
  }
  const user = findUserById(session.userId);
  if (!user) {
    return DEFAULT_LOCALE;
  }
  return resolveLocale(user.locale);
}
