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

export interface IFileData {
  field: string; // formFiled
  name: string;
  data: string | ArrayBuffer; // base64 or binary
}

export interface IUploadRequest extends Omit<IHTTPRequest, 'body'> {
  file: IFileData | IFileData[];
  formData?: Record<string, unknown>;
}

export interface IRequestOption {
  signal?: {
    onabort(): void;
  };
  onProgress?(event: IProgressEvent): void;
}

export interface IProgressEvent {
  total: number;
  loaded: number;
  percent: number;
}

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
  request(req: IHTTPRequest, option?: IRequestOption): Promise<IHTTPResponse>;
  upload(req: IUploadRequest, option?: IRequestOption): Promise<IHTTPResponse>;
  storage: IKVStorage;
  connect(url: string, protocol?: string): WebSocket;
}
