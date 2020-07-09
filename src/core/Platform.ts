import { HTTPRequest, HTTPResponse } from './http';

export interface IRequestOption {
  signal: AbortSignal;
}

export type Request = (
  req: HTTPRequest,
  option?: IRequestOption
) => Promise<HTTPResponse>;

export interface FileData {
  field: string;
  name: string;
  data: string;
}

export type Upload = (
  method: string,
  url: string,
  files: FileData[],
  formData?: Record<string, string>
) => Promise<HTTPResponse>;

export interface Network {
  request: Request;
  upload: Upload;
}

export interface KVStorage {
  set(key: string, value: string): void;
  get(key: string): string;
  remove(key: string): void;
  clear(): void;
}

export interface Platform {
  name: string;
  network: Network;
  storage: KVStorage;
}

export class PlatformSupport {
  private static platform: Platform;

  static setPlatform(platform: Platform): void {
    if (PlatformSupport.platform) {
      throw new Error('platform already defined');
    }
    PlatformSupport.platform = platform;
  }

  static getPlatform(): Platform {
    if (!PlatformSupport.platform) {
      throw new Error('platform not set');
    }
    return PlatformSupport.platform;
  }
}
