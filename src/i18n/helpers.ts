import localesConfig from "./locales.json";
import en_us from "./en.json";
import type {AvailableLocales} from "./types";
import {DEFAULT_LOCALE} from "./types";
import {DeepPartial} from "../types";

type LocaleTranslation = typeof en_us;
type LocalesLoaded = Record<
  AvailableLocales,
  DeepPartial<LocaleTranslation> | null
>;

const deepCopy = <T>(obj: T): T => {
  return structuredClone(obj);
};

export const i18nTranslate = (
  key: string,
  interpolate = {},
  locale: AvailableLocales = DEFAULT_LOCALE,
  isLowerCase?: boolean,
): string => {
  const mapping = localesLoaded[locale] || localesLoaded[DEFAULT_LOCALE];
  const elements = key.split(".");
  // we start from the mapping object then iteratively reduce it until we end up with the translated string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result = deepCopy(mapping) as any;

  for (const elem of elements) {
    if (typeof result === "string" || !(elem in result)) {
      result = "";
      break;
    }
    result = result[elem];
  }

  const keysToInterpolate = Object.keys(interpolate);

  // If both the text and interpolations exist, iterate over them
  // and replace {{int}} with passed int interpolation values
  if (keysToInterpolate.length && result) {
    result = keysToInterpolate.reduce((acc, curr) => {
      const re = new RegExp(`{{${curr}}}`, "g");
      return acc.replace(re, interpolate[curr]);
    }, result);
  }

  // Fallback locale
  if (locale !== DEFAULT_LOCALE && !result) {
    result = i18nTranslate(key, interpolate, DEFAULT_LOCALE, isLowerCase);
  }

  return typeof result === "string" && isLowerCase
    ? result.toLowerCase()
    : result;
};

export const loadLocale = async (
  locale: AvailableLocales = DEFAULT_LOCALE,
): Promise<void> => {
  const lowerCaseLocale = locale.toLowerCase();

  // no need to import locale if it's already in memory
  if (localesLoaded[lowerCaseLocale]) {
    return;
  }

  const file =
    localesConfig.locales.find((l) => l.code === lowerCaseLocale)?.file ?? null;

  if (file) {
    localesLoaded[lowerCaseLocale] = await import(`../../locales/${file}`);
  }
};

export const localesLoaded: LocalesLoaded = {
  "en-us": en_us,
};
