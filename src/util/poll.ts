import {sleep} from "./sleep";

export const pollUntilSuccess = async <T>({
  fn,
  attempts,
  interval,
}: {
  fn: () => Promise<{success: boolean; value: T}>;
  attempts: number;
  interval: number;
}): Promise<{success: boolean; value: T | null}> => {
  for (let i = 0; i < attempts; i++) {
    try {
      const {success, value} = await fn();
      if (success) {
        return {success, value};
      }
    } catch (e) {
      console.error(`Attempt ${i} failed`, e);
    }
    await sleep(interval);
  }
  return {success: false, value: null};
};
