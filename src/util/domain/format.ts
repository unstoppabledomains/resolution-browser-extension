import {
  DomainDescription,
  DomainSuffixes,
  EXTERNAL_DOMAIN_SUFFIXES,
  MANAGEABLE_DOMAIN_LABEL,
  WEB2_DOMAIN_SUFFIXES,
} from "../../types";

export const convertCentToDollar = (cent: number): number => {
  return cent / 100;
};

const getUsdNumberFormat = (showCents: boolean) => {
  const locales: string[] = ["en-US"];
  return new Intl.NumberFormat(
    // Prefer browser's locale, fallback on en-US
    locales.filter((x) => Boolean(x)),
    {
      style: "currency",
      currency: "USD",
      // to hide cents, set the max fraction digits to zero
      maximumFractionDigits: showCents ? 2 : 0,
      minimumFractionDigits: showCents ? 2 : 0,
    },
  );
};

export const convertCentToUsdString = (
  cent: number,
  alwaysShowCents: boolean = false,
): string => {
  const dollars = convertCentToDollar(cent);
  const cents = Math.abs(cent) % 100;

  const formatter = getUsdNumberFormat(cents > 0 || alwaysShowCents);

  // NOTE: for locales that result in whitespace in the formatted output
  // the formatted string output uses NBSP (non-breaking space) characters (char code 160)
  // rather than normal space characters (char code 32)
  return formatter.format(dollars);
};

const isDomainFormatValid = (
  domain: string,
  labelValidationRegex: RegExp,
  allowIdn: boolean,
): boolean => {
  if (!domain) {
    return false;
  }
  let parts: string[] = [domain];
  if (domain.includes(".")) {
    parts = domain.split(".");
  }
  if (parts.length < 2) {
    return false;
  }
  return parts.every((part, idx) => {
    if (idx === 0) {
      // left-most: label
      return isDomainLabelValid(part, labelValidationRegex, allowIdn);
    } else {
      return isDomainLabelValid(part, MANAGEABLE_DOMAIN_LABEL, allowIdn);
    }
  });
};

export const isDomainValidForManagement = (domain: string): boolean => {
  return isDomainFormatValid(domain, MANAGEABLE_DOMAIN_LABEL, false);
};

const isExternalDomainValid = (
  domain: string,
  labelValidationRegex: RegExp,
  allowIdn: boolean,
): boolean => {
  if (!isDomainFormatValid(domain, labelValidationRegex, allowIdn)) {
    return false;
  }

  const {label, extension} = splitDomain(domain);
  return Boolean(label) && isExternalDomainSuffixValid(extension);
};

export const isExternalDomain = (domain: string): boolean => {
  return isExternalDomainValid(domain, MANAGEABLE_DOMAIN_LABEL, true);
};

export const isExternalDomainSuffixValid = (extension: string): boolean => {
  return EXTERNAL_DOMAIN_SUFFIXES.includes(extension);
};

/**
 * IDN (Internationalized domain name) labels are not supported yet
 */
export const isInternationalDomainLabel = (label: string): boolean =>
  label.startsWith("xn--");

export const isWeb2Domain = (domain: string): boolean => {
  const {label, extension} = splitDomain(domain);
  return Boolean(label) && isWeb2DomainSuffixValid(extension);
};

export const isWeb2DomainSuffixValid = (extension: string): boolean => {
  return WEB2_DOMAIN_SUFFIXES.includes(extension);
};

const isDomainLabelValid = (
  label: string,
  labelValidationRegex: RegExp,
  allowIdn: boolean = false,
): boolean => {
  if (!allowIdn && isInternationalDomainLabel(label)) {
    return false;
  }

  return new RegExp(labelValidationRegex).test(label);
};

export const splitDomain = (domain: string): DomainDescription => {
  const splitted = domain.split(".");
  const extension = splitted.pop()!;
  const label = splitted.shift()!;
  return {
    name: domain,
    label,
    extension: extension as DomainSuffixes,
    sld: splitted.length ? splitted.join(".") : null,
  };
};
