import { Platform, Network, FileData, PlatformSupport } from '../src/core';
import { HTTPRequest, HTTPResponse } from '../src/core/http';

export class TestNetwork implements Network {
  requests: HTTPRequest[] = [];

  private _nextResponse: HTTPResponse;
  private _defaultResponse: HTTPResponse = {
    status: 200,
    body: {},
  };

  setNextResponse(res: HTTPResponse): void {
    this._nextResponse = res;
  }

  async request(req: HTTPRequest): Promise<HTTPResponse> {
    this.requests.push(req);
    if (this._nextResponse) {
      const res = this._nextResponse;
      this._nextResponse = null;
      return res;
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
};

export function setGlobalTestPlatform(): void {
  try {
    PlatformSupport.setPlatform(globalTestPlatform);
  } catch (err) {
    // ignore
  }
}

setGlobalTestPlatform();
