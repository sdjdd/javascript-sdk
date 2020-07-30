import {
  Adapters as IAdapters,
  RequestOptions,
  HTTPMethod,
  FormDataPart,
  Response,
} from '@leancloud/adapter-types';
import { log } from './utils';

export interface IHTTPRequest {
  baseURL?: string;
  path?: string;
  method?: HTTPMethod;
  header?: Record<string, string>;
  query?: Record<string, string>;
  body?: Record<string, any>;
}

export interface IHTTPResponse {
  status: number;
  header?: Record<string, string | string[]>;
  body?: unknown;
}

export type IRequestOption = Pick<RequestOptions, 'onprogress' | 'signal'>;
export interface IUploadRequest extends Omit<IHTTPRequest, 'body'> {
  form?: Record<string, any>;
}

function parseURL(req: IHTTPRequest): string {
  if (!req.baseURL) {
    throw new Error('The baseURL is empty');
  }
  let url = req.baseURL + (req.path ?? '');
  if (req.query) {
    const qstr = Object.entries(req.query)
      .filter((kv) => kv[1] !== undefined)
      .map(([k, v]) => k + '=' + encodeURIComponent(v))
      .join('&');
    const sp = url.includes('?') ? '&' : '?';
    url += sp + qstr;
  }
  return url;
}

function parseResponse(res: Response): IHTTPResponse {
  return {
    status: res.status,
    header: res.headers as Record<string, string>,
    body: res.data,
  };
}

export class Adapters {
  private static _adapters: IAdapters;

  static set(adapters: Partial<IAdapters>): void {
    if (Adapters._adapters) {
      throw new Error('Adapters already defined');
    }
    Adapters._adapters = adapters as IAdapters;
  }

  static get(): IAdapters {
    if (!Adapters._adapters) {
      throw new Error('Adapters not set');
    }
    return Adapters._adapters;
  }

  static async request(
    req: IHTTPRequest,
    option?: IRequestOption
  ): Promise<IHTTPResponse> {
    log('LC:Request:send', '%O', req);
    const _res = await Adapters.get().request(parseURL(req), {
      ...option,
      method: req.method || 'GET',
      headers: req.header,
      data: req.body,
    });
    const res = parseResponse(_res);
    log('LC:Request:recv', '%O', res);
    return res;
  }

  static async upload(
    req: IUploadRequest,
    file: FormDataPart,
    option?: IRequestOption
  ): Promise<IHTTPResponse> {
    log('LC:Upload:send', '%O', req);
    const _res = await Adapters.get().upload(parseURL(req), file, {
      ...option,
      method: req.method || 'POST',
      headers: req.header,
      data: req.form,
    });
    const res = parseResponse(_res);
    log('LC:Upload:recv', '%O', res);
    return res;
  }
}
