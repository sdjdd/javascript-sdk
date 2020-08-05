export interface IURLComponents {
  scheme?: string;
  host?: string;
  port?: string;
  path?: string;
  query?: string;
  hash?: string;
}

export class URLUtils {
  static decode(url: string): IURLComponents {
    const re = /^(?:([A-Za-z]+):)?\/{0,3}([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
    const cs = url.match(re);
    return {
      scheme: cs[1],
      host: cs[2],
      port: cs[3],
      path: cs[4],
      query: cs[5],
      hash: cs[6],
    };
  }

  static encodeQuery(query: Record<string, string>): string {
    let str = '';
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (str) str += '&';
        str += key + '=' + encodeURIComponent(value);
      });
    }
    return str;
  }
}
