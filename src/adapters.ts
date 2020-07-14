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

export interface IUploadRequest extends Omit<IHTTPRequest, 'body'> {
  file: IFileData | IFileData[];
  formData?: Record<string, unknown>;
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

export interface IProgressEvent {
  total: number;
  loaded: number;
  percent: number;
}

export type ProgressListener = (e: IProgressEvent) => void;

export type Upload = (
  req: IUploadRequest,
  progressListener?: ProgressListener
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
