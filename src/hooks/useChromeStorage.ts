import {useState, useEffect} from "react";

const useChromeStorage = (key: string) => {
  const [value, setValue] = useState(null);

  useEffect(() => {
    chrome.storage.sync.get([key], (result) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        setValue(result[key]);
      }
    });
  }, [key]);

  return value;
};

export default useChromeStorage;
