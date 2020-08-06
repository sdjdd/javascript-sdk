import {
  IHTTPRequest,
  IHTTPResponse,
  Adapters,
  IRequestOption,
} from '../Adapters';
import { URLUtils, log } from '../utils';
import { Response } from '@leancloud/adapter-types';
import { IApp, IAuthOption } from '../types';
import { Cache } from '../Cache';
import { UluruError } from '../errors';
import { KEY_SESSION_TOKEN } from '../Cache';

function parseURL(req: IHTTPRequest): string {
  if (!req.baseURL) {
    throw new Error('The baseURL is empty');
  }
  let url = req.baseURL + (req.path ?? '');
  const queryStr = URLUtils.encodeQuery(req.query);
  if (queryStr) {
    url += '?' + queryStr;
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

class RequestTask {
  throwUluruError = false;

  constructor(public req: IHTTPRequest, public option: IRequestOption) {}

  to(app: IApp, option?: IAuthOption): this {
    this.throwUluruError = true;

    const { req } = this;
    const { userAgent = 'unknown' } = Adapters.get().platformInfo;

    req.baseURL = app.serverURL;

    if (!this.req.header) {
      this.req.header = {};
    }
    req.header['Content-Type'] = 'application/json';
    req.header['X-LC-UA'] = userAgent;
    req.header['X-LC-Id'] = app.appId;

    let useMasterKey = app.useMasterKey;
    if (option?.useMasterKey !== undefined) {
      useMasterKey = option.useMasterKey;
    }
    if (useMasterKey) {
      if (!app.masterKey) {
        throw new Error('The master key is not defined');
      }
      req.header['X-LC-Key'] = app.masterKey + ',master';
    } else {
      req.header['X-LC-Key'] = app.appKey;
    }

    const sessionToken =
      option?.sessionToken ||
      (Cache.get(app, KEY_SESSION_TOKEN, true) as string);
    if (sessionToken) {
      req.header['X-LC-Session'] = sessionToken;
    }

    return this;
  }

  then<TResult>(
    onFulfilled?: (res: IHTTPResponse) => TResult
  ): Promise<TResult> {
    log('LC:Request:send', '%O', this.req);
    return new Promise((resolve, reject) => {
      Adapters.get()
        .request(parseURL(this.req), {
          ...this.option,
          method: this.req.method || 'GET',
          headers: this.req.header,
          data: this.req.body,
        })
        .then((_res) => {
          const res = parseResponse(_res);
          log('LC:Request:recv', '%O', res);
          if (!_res.ok && this.throwUluruError) {
            const { code, error } = res.body as { code: number; error: string };
            reject(new UluruError(code, error));
            return;
          }
          if (onFulfilled) {
            resolve(onFulfilled(res));
          } else {
            resolve();
          }
        })
        .catch(reject);
    });
  }
}

export function send(req: IHTTPRequest, option?: IRequestOption): RequestTask {
  return new RequestTask(req, option);
}
