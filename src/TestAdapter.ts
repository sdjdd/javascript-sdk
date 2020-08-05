import {
  Adapters as IAdapters,
  RequestOptions,
  Response,
  HTTPMethod,
  FormDataPart,
  PlatformInfo,
  SyncStorage,
  Storage,
  WebSocket,
} from '@leancloud/adapter-types';

import { EventEmitter } from 'eventemitter3';
import { Adapters } from './Adapters';
import { URLUtils, IURLComponents } from './utils';

export interface ITestRequest {
  url: string;
  method?: HTTPMethod;
  header?: Record<string, string>;
  body?: any;
}

export interface ITestResponse {
  status: number;
  header?: Record<string, string>;
  body?: any;
}

export class TestRequest implements ITestRequest {
  url: string;
  method: HTTPMethod;
  header?: Record<string, string>;
  body?: any;

  constructor(req: ITestRequest) {
    this.url = req.url;
    this.method = req.method;
    this.header = req.header;
    this.body = req.body;
  }

  get urlComponents(): IURLComponents {
    return URLUtils.decode(this.url);
  }

  get path(): string {
    return this.urlComponents.path;
  }

  get query(): Record<string, string> {
    const query: Record<string, string> = {};
    const queryStr = this.urlComponents.query;
    if (queryStr) {
      queryStr.split('&').forEach((kv) => {
        const [key, value] = kv.split('=');
        query[key] = decodeURIComponent(value);
      });
    }
    return query;
  }
}

class TestStorage implements SyncStorage {
  kv = new Map<string, string>();

  getItem(key: string): string | null {
    return this.kv.get(key);
  }

  setItem(key: string, value: string): void {
    this.kv.set(key, value);
  }

  removeItem(key: string): void {
    this.kv.delete(key);
  }

  clear(): void {
    this.kv.clear();
  }
}

class TestWebsocket extends EventEmitter implements WebSocket {
  static sockets: TestWebsocket[] = [];

  private static _nextId = 1;

  id: number;

  constructor(public url: string, public protocols?: string | string[]) {
    super();
    this.id = TestWebsocket._nextId++;
    TestWebsocket.sockets.push(this);
  }

  addEventListener(event: string, handler: (...args: any[]) => any): void {
    this.on(event, handler);
  }

  removeEventListener(event: string, handler: (...args: any[]) => any): void {
    this.off(event, handler);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  send(data: string | ArrayBuffer): void {
    // TODO
  }

  close(): void {
    // TODO
  }
}

export class TestAdapter implements Partial<IAdapters> {
  platformInfo: PlatformInfo = {
    name: 'Test platform',
  };
  requests: TestRequest[] = [];
  requestErrors: Error[] = [];
  responses: ITestResponse[] = [];
  defaultResponse: ITestResponse = {
    status: 200,
    body: {},
  };
  storage: Storage = new TestStorage();
  WebSocket = TestWebsocket;

  request(url: string, options?: RequestOptions): Promise<Response> {
    if (this.requestErrors.length > 0) {
      throw this.requestErrors.pop();
    }
    this.requests.push(
      new TestRequest({
        url,
        method: options?.method,
        header: options?.headers,
        body: options?.data,
      })
    );
    let res: ITestResponse;
    if (this.responses.length > 0) {
      res = this.responses.pop();
    } else {
      res = this.defaultResponse;
    }
    return Promise.resolve({
      status: res.status,
      ok: !(res.status >= 400),
      headers: res.header,
      data: res.body,
    });
  }

  /* eslint-disable */
  upload(
    url: string,
    file: FormDataPart,
    options?: RequestOptions
  ): Promise<Response> {
    return Promise.resolve({}); // TODO
  }
  /* eslint-enable */
}

export const globalTestAdapter = new TestAdapter();

export function setGlobalTestAdapter(): boolean {
  let ok = false;
  try {
    Adapters.set(globalTestAdapter);
    ok = true;
  } catch {
    // ignore
  }
  return ok;
}
