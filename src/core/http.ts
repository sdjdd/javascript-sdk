export interface HTTPResponse {
  status: number;
  headers: Record<string, string | string[]>;
  body: unknown;
}

export class HTTPRequest {
  method: string;
  baseURL: string;
  path: string;
  query: Record<string, string> = {};
  header: Record<string, string> = {};
  body: unknown;
  resolve: (value?: HTTPResponse | PromiseLike<HTTPResponse>) => void;
  reject: (reason?: unknown) => void;

  constructor(options?: {
    method?: string;
    baseURL?: string;
    path?: string;
    query?: Record<string, string>;
    header?: Record<string, string>;
    body?: unknown;
  }) {
    this.method = options.method || 'GET';
    this.baseURL = options.baseURL || '';
    this.path = options.path || '';
    this.query = options.query || {};
    this.header = options.header || {};
    this.body = options.body;

    new Promise<HTTPResponse>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  get url(): string {
    // TODO: support frame
    let url = this.baseURL + this.path;
    const queryStr = Object.entries(this.query)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    if (queryStr.length > 0) {
      const sp = url.includes('?') ? '&' : '?';
      url += sp + queryStr;
    }
    return url;
  }
}
