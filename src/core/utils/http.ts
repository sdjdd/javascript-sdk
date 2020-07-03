import { HTTPResponse } from '../http';

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
