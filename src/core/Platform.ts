import { HTTPRequest, HTTPResponse } from './http';

export type Request = (req: HTTPRequest) => Promise<HTTPResponse>;

export type Upload = (
  method: string,
  url: string,
  files: { field: string; name: string; data: string }[],
  formData?: Record<string, string>
) => Promise<HTTPResponse>;

export interface Network {
  request: Request;
  upload: Upload;
}

export interface Platform {
  name: string;
  network: Network;
}
