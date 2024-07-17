import type {ReactNode} from "react";
import React, {useEffect, useState} from "react";

import TranslationContext from "./TranslationContext";
import {i18nTranslate, loadLocale, localesLoaded} from "./helpers";
import type {T} from "./index";
import type {AvailableLocales} from "./types";
import {DEFAULT_LOCALE} from "./types";
import usePrevious from "../hooks/usePrevious";

type Props = {
  children: ReactNode;
};

const TranslationProvider: any = (props: Props) => {
  const {children} = props;
  const [ready, setReady] = useState(true);
  const [locale, setLocale] = useState<AvailableLocales>(DEFAULT_LOCALE);
  const prevLocale = usePrevious(locale, false);
  const t: T = (key, interpolate = {}, _locale, isLowerCase) => {
    return i18nTranslate(key, interpolate, locale, isLowerCase);
  };

  // make sure preferred locale is loaded
  useEffect(() => {
    console.log("locale", locale);
    void (async () => {
      if (!localesLoaded[locale]) {
        setReady(false);
        await loadLocale(locale);
      }

      setReady(true);
    })();
  }, [locale, localesLoaded]);

  return (
    <TranslationContext.Provider value={[t, setLocale, locale]}>
      {ready ? children : null}
    </TranslationContext.Provider>
  );
};

export default TranslationProvider;
