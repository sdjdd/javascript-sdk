import {
  IHTTPRequest,
  HTTPHeader,
  IUploadRequest,
  IFileData,
} from '../../adapters';

export interface IHTTPRequestInitOption {
  method?: string;
  baseURL?: string;
  path?: string;
  query?: Record<string, string>;
  header?: HTTPHeader;
  body?: unknown;
}

export interface IUploadRequestInitOption
  extends Omit<IHTTPRequestInitOption, 'body'> {
  file: IFileData | IFileData[];
  formData?: Record<string, unknown>;
}

export class HTTPRequest implements IHTTPRequest {
  method: string;
  baseURL: string;
  path: string;
  query: Record<string, string> = {};
  header: HTTPHeader = {};
  body: unknown;

  constructor(option?: IHTTPRequestInitOption) {
    this.method = option?.method ?? 'GET';
    this.baseURL = option?.baseURL;
    this.path = option?.path;
    this.query = option?.query ?? {};
    this.header = option?.header ?? {};
    this.body = option?.body;
  }

  get url(): string {
    if (!this.baseURL) {
      throw new Error('The baseURL is empty');
    }
    let url = this.baseURL + (this.path ?? '');
    const qstr = Object.entries(this.query)
      .map(([k, v]) => k + '=' + encodeURIComponent(v))
      .join('&');
    if (qstr) {
      const sp = url.includes('?') ? '&' : '?';
      url += sp + qstr;
    }
    return url;
  }
}

export class UploadRequest extends HTTPRequest implements IUploadRequest {
  file: IFileData | IFileData[];
  formData?: Record<string, unknown>;

  constructor(option: IUploadRequestInitOption) {
    super(option);
    this.file = option.file;
    this.formData = option.formData;
  }
}
