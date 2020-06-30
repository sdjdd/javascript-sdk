import { HTTPRequest, HTTPResponse } from './http';

export type Request = (req: HTTPRequest) => Promise<HTTPResponse>;

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

export interface Platform {
  name: string;
  network: Network;
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
