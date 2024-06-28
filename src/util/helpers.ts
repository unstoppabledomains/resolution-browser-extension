export const supportedDomains: string[] = [
  ".crypto",
  ".nft",
  ".wallet",
  ".bitcoin",
  ".x",
  ".888",
  ".dao",
  ".blockchain",
  ".zil",
  ".hi",
  ".klever",
  ".kresus",
  ".clay",
  ".polygon",
  ".anime",
  ".manga",
  ".binanceus",
  ".go",
  ".altimist",
  ".pudgy",
  ".austin",
  ".unstoppable",
  ".bitget",
  ".pog",
  ".witg",
  ".metropolis",
  ".wrkx",
  ".secret",
];

//return true if url ends in one of the supported domains
export const supportedDomain = (q: string): boolean =>
  supportedDomains.some((d: string): boolean => q.endsWith(d));

export const uniqueArray = (a: any[]): any[] => {
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }
  var unique = a.filter(onlyUnique);

  return unique;
};
