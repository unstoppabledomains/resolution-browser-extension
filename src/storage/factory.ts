export interface IDeviceStore {
  get(deviceId: string, key: string): Promise<string | null>;
  set(deviceId: string, key: string, value: string): Promise<void>;
  clear(deviceId: string, key: string): Promise<void>;
  getAllKeys(deviceId: string): Promise<string[]>;
}

const LOCAL_MEMORY: Record<string, Record<string, string>> = {};

export class MemoryDeviceStoreProvider implements IDeviceStore {
  async get(deviceId: string, key: string): Promise<string | null> {
    // console.log("GET MEMORY DATA");

    if (!LOCAL_MEMORY[deviceId]) {
      return null;
    }
    if (!LOCAL_MEMORY[deviceId][key]) {
      return null;
    }
    return LOCAL_MEMORY[deviceId][key];
  }

  async set(deviceId: string, key: string, value: string): Promise<void> {
    // console.log("SET MEMORY DATA", deviceId, key, value);

    if (!LOCAL_MEMORY[deviceId]) {
      LOCAL_MEMORY[deviceId] = {};
    }
    LOCAL_MEMORY[deviceId][key] = value;
  }

  async clear(deviceId: string, key: string): Promise<void> {
    if (!LOCAL_MEMORY[deviceId]?.[key]) {
      return;
    }
    delete LOCAL_MEMORY[deviceId][key];
  }

  async getAllKeys(deviceId: string): Promise<string[]> {
    if (!LOCAL_MEMORY[deviceId]) {
      return Promise.resolve([]);
    }
    return Object.keys(LOCAL_MEMORY[deviceId]);
  }
}

export class ReactDeviceStoreProvider implements IDeviceStore {
  constructor(
    private readonly state: Record<string, Record<string, string>>,
    private readonly saveState: (
      state: Record<string, Record<string, string>>,
    ) => void,
  ) {}

  async get(deviceId: string, key: string): Promise<string | null> {
    if (!this.state[deviceId]) {
      return null;
    }
    if (!this.state[deviceId][key]) {
      return null;
    }
    return this.state[deviceId][key];
  }

  async set(deviceId: string, key: string, value: string): Promise<void> {
    if (!this.state[deviceId]) {
      this.state[deviceId] = {};
    }
    this.state[deviceId][key] = value;
    this.saveState({...this.state});
  }

  async clear(deviceId: string, key: string): Promise<void> {
    if (!this.state[deviceId]?.[key]) {
      return;
    }
    delete this.state[deviceId][key];
    this.saveState({...this.state});
  }

  async getAllKeys(deviceId: string): Promise<string[]> {
    if (!this.state[deviceId]) {
      return Promise.resolve([]);
    }
    return Object.keys(this.state[deviceId]);
  }
}

export class StorageFactoryProvider {
  constructor(
    private readonly memoryStoreProvider: MemoryDeviceStoreProvider,
    private readonly reactStoreProvider?: ReactDeviceStoreProvider,
  ) {}

  buildDeviceStorage(): IDeviceStore {
    return this.reactStoreProvider || this.memoryStoreProvider;
  }
}
