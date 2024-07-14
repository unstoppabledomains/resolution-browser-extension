import {
  FireblocksNCWFactory,
  IEventsHandler,
  IKeyBackupEvent,
  TEvent,
} from "@fireblocks/ncw-js-sdk";
import {SecureKeyStorageProvider} from "./secureStorage";
import {
  MemoryDeviceStoreProvider,
  ReactDeviceStoreProvider,
  StorageFactoryProvider,
} from "../storage/factory";
import {RpcMessageProvider} from "./rpcHandler";
import {UnsecureKeyStorageProvider} from "./unsecureStorage";

export const FB_MAX_RETRY = 100;
export const FB_WAIT_TIME_MS = 1000;

const getFireblocksNCW = async (
  deviceId: string,
  jwt: string,
  opts?: {
    isRefreshToken?: boolean;
    state: Record<string, Record<string, string>>;
    saveState: (state: Record<string, Record<string, string>>) => void;
  },
) => {
  const messagesHandler = new RpcMessageProvider(jwt);

  const eventsHandler: IEventsHandler = {
    handleEvent: (event: TEvent) => {
      switch (event.type) {
        case "transaction_signature_changed":
          console.log(
            `Transaction signature status: ${event.transactionSignature.transactionSignatureStatus}`,
          );
          break;

        case "keys_backup":
          console.log(
            `Key backup status: ${JSON.stringify((event as IKeyBackupEvent).keysBackup)}`,
          );
          break;
      }
    },
  };

  const storageFactory = new StorageFactoryProvider(
    new MemoryDeviceStoreProvider(),
    opts ? new ReactDeviceStoreProvider(opts.state, opts.saveState) : undefined,
  );
  const storageProvider = storageFactory.buildDeviceStorage();

  const secureKeyStorageProvider = new SecureKeyStorageProvider(
    deviceId,
    storageProvider,
  );
  const unsecureStorageProvider = new UnsecureKeyStorageProvider(
    deviceId,
    storageProvider,
  );

  const fireblocksNCW = await FireblocksNCWFactory({
    env: "production",
    deviceId,
    messagesHandler,
    eventsHandler,
    secureStorageProvider: secureKeyStorageProvider,
    storageProvider: unsecureStorageProvider,
  });

  return fireblocksNCW;
};

export default getFireblocksNCW;
