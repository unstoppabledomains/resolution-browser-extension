import {useEffect, useState} from "react";

import {
  getWalletPreferences,
  setWalletPreferences,
} from "../lib/wallet/preferences";
import {WalletPreferences} from "../types/wallet/preferences";

function usePreferences() {
  const [preferences, setPreferences] = useState<WalletPreferences>();

  useEffect(() => {
    const loadPreferences = async () => {
      // retrieve latest preferences, which may be populated by default
      // values if not present
      const storedPreferences = await getWalletPreferences();

      // store the preferences in case this is the first page load
      setPreferences(storedPreferences);
      void setWalletPreferences(storedPreferences);
    };
    void loadPreferences();
  }, []);

  const refreshPreferences = async () => {
    setPreferences(await getWalletPreferences());
  };

  return {preferences, setPreferences, refreshPreferences};
}

export default usePreferences;
