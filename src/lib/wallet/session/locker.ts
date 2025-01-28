import {notifyEvent} from "@unstoppabledomains/ui-components/lib/error";
import {FireblocksStateKey} from "@unstoppabledomains/ui-components/lib/types/fireBlocks";
import {
  isLocked,
  lock,
} from "@unstoppabledomains/ui-components/lib/wallet/pin/locker";
import {getBootstrapState} from "@unstoppabledomains/ui-components/lib/wallet/storage/state";

export const waitForSessionLock = async () => {
  // create an alarm to manage the session lock
  const lockerAlarmName = "sessionLock";
  await chrome.alarms.create(lockerAlarmName, {
    delayInMinutes: 1,
    periodInMinutes: 1,
  });
  chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
    if (alarm.name === lockerAlarmName) {
      await checkSessionLock();
    }
  });

  // indicate the background process has started
  notifyEvent(
    "waiting for session lock events...",
    "info",
    "Extension",
    "Background",
  );
};

const checkSessionLock = async () => {
  if (await isLocked()) {
    try {
      // retrieve wallet state from chrome storage
      const rawState = await chrome.storage.local.get(FireblocksStateKey);
      if (!rawState[FireblocksStateKey]) {
        return;
      }
      const state = JSON.parse(rawState[FireblocksStateKey]);

      // create wrapper method to set wallet state
      const setState = async (v: Record<string, Record<string, string>>) => {
        await chrome.storage.local.set({
          [FireblocksStateKey]: JSON.stringify(v),
        });
      };

      // check whether session is already locked
      const clientState = getBootstrapState(state);
      if (clientState?.lockedRefreshToken) {
        return;
      }

      // lock the session
      await lock(state, setState);
    } catch (e) {
      notifyEvent(e, "warning", "Extension", "Background");
    }
  }
};
