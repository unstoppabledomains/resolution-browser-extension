export type AvailableLocales = 'en-us';

export const DEFAULT_LOCALE: AvailableLocales = 'en-us';

export type I18nInterpolations = Record<string, string | number>;

export type Locale = {
  code: AvailableLocales;
  name: string;
};

// before changing this type make sure it won't break the config in next.config.js
// which is not using static typing
export type Locales = {
  locales: Locale[];
  defaultLocale: 'en-us';
};

export type T = (
  key: string,
  interpolate?: I18nInterpolations,
  locale?: AvailableLocales,
  toLowerCase?: boolean,
) => string;
