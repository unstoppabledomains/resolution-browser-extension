import {createContext} from "react";

import type {AvailableLocales, T} from "./types";
import {DEFAULT_LOCALE} from "./types";

const TranslationContext = createContext<
  [T, (locale: AvailableLocales) => void, AvailableLocales]
>([() => "", () => DEFAULT_LOCALE, DEFAULT_LOCALE]);

export default TranslationContext;
