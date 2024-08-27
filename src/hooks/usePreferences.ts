import {useState, useEffect} from "react";
import {WalletPreferences} from "../types/wallet/preferences";
import {
  getWalletPreferences,
  setWalletPreferences,
} from "../lib/wallet/preferences";

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

  return {preferences, setPreferences};
}

export default usePreferences;
