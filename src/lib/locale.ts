// Server helper: baca locale dari cookie (Next 16 — cookies() async).
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, getDict, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

/** Locale + dictionary sekali panggil untuk komponen server. */
export async function getT() {
  const locale = await getLocale();
  return { locale, t: getDict(locale) };
}
