// eslint-disable-next-line no-control-regex
export const isAscii = (str: string) => /^[\x00-\x7F]+$/.test(str);
