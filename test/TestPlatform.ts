import { PlatformSupport } from '../src/core';
import { MemoryStorage } from '../src/node';
import {
  IPlatform,
  IHTTPResponse,
  IUploadRequest,
  IRequestOption,
} from '../src/adapters';
import { HTTPRequest } from '../src/core/utils';

export class TestPlatform implements IPlatform {
  name: 'Test platform';
  storage = new MemoryStorage();

  private _requests: HTTPRequest[] = [];
  private _responses: IHTTPResponse[] = [];
  private _defaultResponse: IHTTPResponse = {
    status: 200,
    body: {},
  };
  private _errors: Error[] = [];

  pushResponse(res: IHTTPResponse): void {
    this._responses.push(res);
  }

  pushError(err: Error): void {
    this._errors.push(err);
  }

  popRequest(): HTTPRequest {
    if (this._requests.length === 0) {
      throw new Error('No request available');
    }
    return this._requests.pop();
  }

  setDefaultResponse(res: IHTTPResponse): void {
    this._defaultResponse = res;
  }

  async request(req: HTTPRequest): Promise<IHTTPResponse> {
    this._requests.push(req);
    if (this._errors.length > 0) {
      throw this._errors.pop();
    }
    if (this._responses.length > 0) {
      return this._responses.pop();
    }
    return this._defaultResponse;
  }

  async upload(
    req: IUploadRequest,
    option?: IRequestOption
  ): Promise<IHTTPResponse> {
    return {
      status: 200,
      body: {},
    };
  }
}

export const globalTestPlatform = new TestPlatform();

export function setGlobalTestPlatform(): void {
  try {
    PlatformSupport.setPlatform(globalTestPlatform);
  } catch (err) {
    // ignore
  }
}
