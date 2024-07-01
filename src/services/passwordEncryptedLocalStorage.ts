import {
  BrowserLocalStorageProvider,
  ISecureStorageProvider,
  TReleaseSecureStorageCallback,
  decryptAesGCM,
  encryptAesGCM,
} from "@fireblocks/ncw-js-sdk";
import {sha256} from "node-forge";

export type GetUserPasswordCallback = () => Promise<string>;

/// This secure storage implementations creates an encryption key on-demand based on a user password

export class PasswordEncryptedLocalStorage
  extends BrowserLocalStorageProvider
  implements ISecureStorageProvider
{
  private encKey: string | null = null;

  constructor(
    private _salt: string,
    private _getPassword: GetUserPasswordCallback,
  ) {
    super();
  }

  public async getAccess(): Promise<TReleaseSecureStorageCallback> {
    this.encKey = await this._generateEncryptionKey();
    return async () => {
      await this._release();
    };
  }

  private async _release(): Promise<void> {
    this.encKey = null;
  }

  public async get(key: string): Promise<string | null> {
    if (!this.encKey) {
      throw new Error("Storage locked");
    }

    const encryptedData = await super.get(key);
    if (!encryptedData) {
      return null;
    }

    return decryptAesGCM(encryptedData, this.encKey, this._salt);
  }

  public async set(key: string, data: string): Promise<void> {
    if (!this.encKey) {
      throw new Error("Storage locked");
    }

    const encryptedData = await encryptAesGCM(data, this.encKey, this._salt);
    await super.set(key, encryptedData);
  }
  public getAllKeys(): Promise<string[]> {
    // TODO: implement
    return Promise.resolve([]);
  }

  public clear(key: string) {
    // TODO: implement
    return Promise.resolve();
  }

  private async _generateEncryptionKey(): Promise<string> {
    let key = await this._getPassword();
    const sha = sha256.create();

    for (let i = 0; i < 1000; ++i) {
      sha.update(key);
      key = sha.digest().toHex();
    }

    return key;
  }
}
