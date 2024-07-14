import {useEffect, useState} from 'react';
import { ADDRESS_REGEX, MULTI_CHAIN_ADDRESS_REGEX, ResolverKeyName, ResolverKeys, ResolverKeySymbol } from '../types';
import type EnsResolverKeysJson from 'uns/ens-resolver-keys.json';
import type UnsResolverKeysJson from 'uns/resolver-keys.json';
import cloneDeep from 'lodash/cloneDeep';

export type UseResolverKeys = {
  unsResolverKeys: ResolverKeys;
  ensResolverKeys: ResolverKeys;
  loading: boolean;
};

export const EMPTY_RESOLVER_KEYS: ResolverKeys = {
  ResolverKeys: [],
  ResolverKey: {} as ResolverKeys['ResolverKey'],
};

let cachedEnsResolverKeys: typeof EnsResolverKeysJson;
let cachedUnsResolverKeys: typeof UnsResolverKeysJson;

const getUnsResolverKeySymbol = (key: ResolverKeyName): ResolverKeySymbol => {
  let symbol: ResolverKeySymbol = null;

  if (key.match(ADDRESS_REGEX) || key.match(MULTI_CHAIN_ADDRESS_REGEX)) {
    const [, ticker] = key.split('.');
    if (ticker) {
      symbol = ticker;
    }
  }

  return symbol;
};

export const loadUnsResolverKeys = async (): Promise<ResolverKeys> => {
  if (!cachedEnsResolverKeys) {
    cachedUnsResolverKeys = await import('uns/resolver-keys.json');
  }
  const {keys} = cachedUnsResolverKeys;
  const {ResolverKeys, ResolverKey} = cloneDeep(EMPTY_RESOLVER_KEYS);

  for (const keyPair of Object.entries(keys)) {
    const key = keyPair[0] as ResolverKeyName;
    const keyProperties = keyPair[1];
    const {deprecated, validationRegex} = keyProperties;
    const symbol = getUnsResolverKeySymbol(key);
    ResolverKeys.push(key);
    ResolverKey[key] = {deprecated, symbol, validationRegex};
  }

  return {ResolverKeys, ResolverKey};
};

export const loadEnsResolverKeys = async (): Promise<ResolverKeys> => {
  if (!cachedEnsResolverKeys) {
    cachedEnsResolverKeys = await import('uns/ens-resolver-keys.json');
  }
  const {keys} = cachedEnsResolverKeys;
  const {ResolverKeys, ResolverKey} = cloneDeep(EMPTY_RESOLVER_KEYS);

  for (const keyPair of Object.entries(keys)) {
    const key = keyPair[0] as ResolverKeyName;
    const props = keyPair[1];
    const {symbol, validationRegex} = props;
    const deprecated = symbol ? /_LEGACY/.test(symbol) : false;
    ResolverKeys.push(key);
    ResolverKey[key] = {deprecated, symbol, validationRegex};
  }

  return {ResolverKeys, ResolverKey};
};

/**
 * Fetches UNS and ENS resolver keys
 */
const useResolverKeys = (): UseResolverKeys => {
  const [unsResolverKeys, setUnsResolverKeys] = useState(EMPTY_RESOLVER_KEYS);
  const [ensResolverKeys, setEnsResolverKeys] = useState(EMPTY_RESOLVER_KEYS);
  const [loading, setLoading] = useState(true);

  const loadResolverKeys = async () => {
    const [newUnsResolverKeys, newEnsResolverKeys] = await Promise.all([
      loadUnsResolverKeys(),
      loadEnsResolverKeys(),
    ]);
    setUnsResolverKeys(newUnsResolverKeys);
    setEnsResolverKeys(newEnsResolverKeys);
    setLoading(false);
  };

  useEffect(() => {
    void loadResolverKeys();
  }, []);

  return {unsResolverKeys, ensResolverKeys, loading};
};

export default useResolverKeys;
