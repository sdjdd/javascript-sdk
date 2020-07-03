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
  const queryStr = Object.entries(req.query)
    .map(([k, v]) => k + '=' + encodeURIComponent(v))
    .join('&');
  if (queryStr.length > 0) {
    const sp = url.includes('?') ? '&' : '?';
    url += sp + queryStr;
  }
  return url;
}
