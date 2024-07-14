import {ResolverKeyName, ResolverKeys} from "../types";

export const isValidRecordKeyValue = (
  key: ResolverKeyName,
  value: string = "",
  resolverKeys: ResolverKeys,
) => {
  const {ResolverKey} = resolverKeys;

  // If the key is not recognized, it's invalid.
  if (!ResolverKey[key]) {
    return false;
  }

  // Empty value is always valid because this is how the record is removed:
  // we pass an empty value to the backend.
  if (!value) {
    return true;
  }

  const {validationRegex} = ResolverKey[key];
  return !validationRegex || new RegExp(validationRegex).test(value);
};
