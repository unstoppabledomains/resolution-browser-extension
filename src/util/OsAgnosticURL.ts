// on Windows OS new OAURL('http://anything.888') crashing the extension with 'Invalid URL' error
// this OAURL class is a hacky attempt to bring both OS under the same page.

export default class OAURL {
  private isDigitTld: boolean;
  private url: URL;

  constructor(url: string) {
    this.isDigitTld = url.includes(".888");
    this.url = this.isDigitTld
      ? new URL(this.fromDot888ToDotCom(url))
      : new URL(url);
  }

  hostname(): string {
    return this.isDigitTld
      ? this.fromDotComToDot888(this.url.hostname)
      : this.url.hostname;
  }

  protocol(): string {
    return this.url.protocol;
  }

  pathname(): string {
    return this.isDigitTld
      ? this.fromDotComToDot888(this.url.pathname)
      : this.url.pathname;
  }

  searchParams(): URLSearchParams {
    return this.url.searchParams;
  }

  toString(): string {
    return this.isDigitTld
      ? this.fromDotComToDot888(this.url.toString())
      : this.url.toString();
  }

  private fromDotComToDot888(mes: string): string {
    return mes.replace(".com", ".888");
  }

  private fromDot888ToDotCom(mes: string): string {
    return mes.replace(".888", ".com");
  }
}
