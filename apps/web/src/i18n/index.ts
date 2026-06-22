import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { vi } from "./vi";

export const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "vi", label: "VI" },
] as const;
export type LangCode = (typeof LANGUAGES)[number]["code"];

const stored = (() => {
  try {
    return localStorage.getItem("mpt-lang") as LangCode | null;
  } catch {
    return null;
  }
})();

void i18n.use(initReactI18next).init({
  // English strings ARE the keys; `en` needs no resource (t returns the key).
  resources: {
    vi: { translation: vi },
  },
  lng: stored ?? "vi",
  fallbackLng: "en",
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
});

export default i18n;
