export type HTTPHeader = Record<string, string | string[]>;

export interface IHTTPRequest {
  method: string;
  url: string;
  header?: HTTPHeader;
  body?: unknown;
}

export interface IHTTPResponse {
  status: number;
  header?: HTTPHeader;
  body?: unknown;
}

export interface IAbortable {
  signal?: { onabort(): void };
}

export type Request = (
  req: IHTTPRequest,
  option?: IAbortable
) => Promise<IHTTPResponse>;

export interface IFileData {
  field: string;
  name: string;
  data: string | ArrayBuffer;
}

export type Upload = (
  method: string,
  url: string,
  files: IFileData[],
  formData?: Record<string, string>
) => Promise<IHTTPResponse>;

export interface IKVStorage {
  set(key: string, value: string): void;
  get(key: string): string;
  remove(key: string): void;
  clear(): void;
}

export interface IPlatform {
  name?: string;
  version?: string;
  userAgent?: string;
  request: Request;
  upload: Upload;
  storage: IKVStorage;
}
