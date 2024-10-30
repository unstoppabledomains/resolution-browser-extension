// isEthAddress matches EVM wallet addresses
export const isEthAddress = (v: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(v);
};

// isPartialAddress matches truncated EVM wallet addresses
export const isPartialAddress = (v: string): boolean => {
  const partialAddress = v.match(/^0x[a-zA-Z0-9]+[…\.]+[a-zA-Z0-9]+$/);
  return partialAddress !== null && partialAddress.length > 0;
};

// fromPartialAddress searches for the expanded form of a partial address from
// a provided body of text
export const fromPartialAddress = (
  partialAddress: string,
  text: string,
): string | undefined => {
  // prepare the partial address
  let addressParts = partialAddress.split(".");
  if (addressParts.length < 2) {
    addressParts = partialAddress.split("…");
    if (addressParts.length < 2) {
      return;
    }
  }

  // prepare the regex
  const addressMatch = text.match(
    `${addressParts[0]}[A-Za-z0-9]+${addressParts[addressParts.length - 1]}`,
  );
  if (addressMatch && addressMatch.length > 0) {
    // found match
    return addressMatch[0];
  }

  // no match found
  return undefined;
};
