import { HTTPResponse, HTTPRequest } from '../http';
import { PlatformSupport } from '../Platform';

export function httpStatusOK(status: number): boolean {
  return /^2/.test(status.toString());
}

export function checkUluruResponse(res: HTTPResponse): void {
  if (!httpStatusOK(res.status)) {
    const err = res.body as {
      code: number;
      error: string;
    };
    throw new Error(`code: ${err.code}, message: ${err.error}`);
  }
}

export async function requestToUluru(req: HTTPRequest): Promise<HTTPResponse> {
  const platform = PlatformSupport.getPlatform();
  const res = await platform.network.request(req);
  checkUluruResponse(res);
  if (typeof res.body === 'string') {
    res.body = JSON.parse(res.body);
  }
  return res;
}
