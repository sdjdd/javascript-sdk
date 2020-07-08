import { Platform, Network, FileData, PlatformSupport } from '../src/core';
import { HTTPRequest, HTTPResponse } from '../src/core/http';
import { MemoryStorage } from '../src/node';

export class TestNetwork implements Network {
  private _requests: HTTPRequest[] = [];
  private _responses: HTTPResponse[] = [];
  private _defaultResponse: HTTPResponse = {
    status: 200,
    body: {},
  };

  pushResponse(res: HTTPResponse): void {
    this._responses.push(res);
  }

  popRequest(): HTTPRequest {
    return this._requests.pop();
  }

  setDefaultResponse(res: HTTPResponse): void {
    this._defaultResponse = res;
  }

  async request(req: HTTPRequest): Promise<HTTPResponse> {
    this._requests.push(req);
    if (this._responses.length > 0) {
      return this._responses.pop();
    }
    return this._defaultResponse;
  }

  async upload(
    method: string,
    url: string,
    files: FileData[],
    formData?: Record<string, string>
  ): Promise<HTTPResponse> {
    return {
      status: 200,
      body: {},
    };
  }
}

export const globalTestNetwork = new TestNetwork();

export const globalTestPlatform: Platform = {
  name: 'test platform',
  network: globalTestNetwork,
  storage: new MemoryStorage(),
};

export function setGlobalTestPlatform(): void {
  try {
    PlatformSupport.setPlatform(globalTestPlatform);
  } catch (err) {
    // ignore
  }
}
