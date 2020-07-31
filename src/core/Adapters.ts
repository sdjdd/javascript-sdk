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
      .filter((kv) => kv[1] !== undefined && kv[1] !== null)
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

  static kvSet(key: string, value: string): void {
    const { storage } = Adapters.get();
    if (storage.async === true) {
      throw new Error(
        'The adapters provides an async storage, please use async set instead'
      );
    }
    log('LC:KV:set', '%s = %O', key, value);
    storage.setItem(key, value);
  }

  static async kvSetAsync(key: string, value: string): Promise<void> {
    log('LC:KV:set', '%s = %O', key, value);
    await Adapters.get().storage.setItem(key, value);
  }

  static kvGet(key: string): string {
    const { storage } = Adapters.get();
    if (storage.async === true) {
      throw new Error(
        'The adapters provides an async storage, please use async get instead'
      );
    }
    const value = storage.getItem(key);
    log('LC:KV:get', '%s = %O', key, value);
    return value;
  }

  static async kvGetAsync(key: string): Promise<string> {
    const value = await Adapters.get().storage.getItem(key);
    log('LC:KV:get', '%s = %O', key, value);
    return value;
  }

  static kvRemove(key: string): void | Promise<void> {
    log('LC:KV:rm', key);
    return Adapters.get().storage.removeItem(key);
  }

  static kvClear(): void | Promise<void> {
    log('LC:KV:clear', 'remove all keys');
    return Adapters.get().storage.clear();
  }
}
