export interface HTTPRequest {
  method: string;
  baseURL: string;
  path?: string;
  query?: Record<string, string>;
  header?: Record<string, string>;
  body?: unknown;
}

export interface HTTPResponse {
  status: number;
  header?: Record<string, string | string[]>;
  body?: unknown;
}

export function parseHTTPRequestURL(req: HTTPRequest): string {
  let url = req.baseURL + (req.path ?? '');
  if (req.query) {
    const qstr = Object.entries(req.query)
      .map(([k, v]) => k + '=' + encodeURIComponent(v))
      .join('&');
    if (qstr.length > 0) {
      const sp = url.includes('?') ? '&' : '?';
      url += sp + qstr;
    }
  }
  return url;
}
