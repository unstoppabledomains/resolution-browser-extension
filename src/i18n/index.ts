import {useContext} from "react";

import TranslationContext from "./TranslationContext";
import TranslationProvider from "./TranslationProvider";

const useTranslationContext = () => useContext(TranslationContext);

export * from "./types";
export {TranslationProvider};
export default useTranslationContext;
