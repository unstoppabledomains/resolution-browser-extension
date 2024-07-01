import type {
  ISecureStorageProvider,
  TReleaseSecureStorageCallback,
} from "@fireblocks/ncw-js-sdk";
import {decryptAesGCM, encryptAesGCM} from "@fireblocks/ncw-js-sdk";

const KEY_PREFIX = "SECURE_";

export interface IDeviceStore {
  get(deviceId: string, key: string): Promise<string | null>;
  set(deviceId: string, key: string, value: string): Promise<void>;
  clear(deviceId: string, key: string): Promise<void>;
  getAllKeys(deviceId: string): Promise<string[]>;
}

export class SecureKeyStorageProvider implements ISecureStorageProvider {
  private readonly PASSWORD: string = "fakePassword";
  private encKey: string | null = null;

  constructor(
    private readonly deviceId: string,
    private readonly storageProvider: IDeviceStore,
  ) {}

  async getAccess(): Promise<TReleaseSecureStorageCallback> {
    this.encKey = await this.generateFakeEncryptionKey();
    return async () => {
      await this.release();
    };
  }

  async get(key: string): Promise<string | null> {
    console.log("GET DATA", key);

    key = this.getKey(key);

    if (!this.encKey) {
      throw new Error("Storage locked");
    }

    const value = await this.storageProvider.get(this.deviceId, key);

    if (!value) {
      return null;
    }

    const decryptedData = await decryptAesGCM(
      value,
      this.encKey,
      this.deviceId,
    );

    return decryptedData;
  }

  async set(key: string, data: string): Promise<void> {
    key = this.getKey(key);

    if (!this.encKey) {
      throw new Error("Storage locked");
    }

    // encrypt the value. use the device id as the salt
    const encryptedData = await encryptAesGCM(data, this.encKey, this.deviceId);

    await this.storageProvider.set(this.deviceId, key, encryptedData);
  }

  async clear(key: string): Promise<void> {
    key = this.getKey(key);

    await this.storageProvider.clear(this.deviceId, key);
  }

  private async generateFakeEncryptionKey(): Promise<string> {
    return this.PASSWORD;
  }

  private async release(): Promise<void> {
    this.encKey = null;
  }

  async getAllKeys(): Promise<string[]> {
    const keys = await this.storageProvider.getAllKeys(this.deviceId);
    const filteredKeys = keys
      .filter((k) => k.startsWith(KEY_PREFIX))
      .map((k) => k.substring(KEY_PREFIX.length));

    return filteredKeys;
  }

  private getKey(key: string): string {
    return KEY_PREFIX + key;
  }
}
