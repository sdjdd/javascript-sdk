let platform: Platform = null;

export function setPlatform(plat: Platform): void {
  if (platform !== null) {
    throw new Error('Platform already defined');
  }
  platform = plat;
}

export function getPlatform(): Platform {
  if (platform === null) {
    throw new Error('Platform not define');
  }
  return platform;
}

export type Request = (
  method: string,
  url: string,
  headers: Record<string, string>,
  data?: unknown
) => Promise<Response>;

export interface Response {
  status: number;
  headers: Record<string, string | string[]>;
  body: unknown;
}

export type Upload = (
  method: string,
  url: string,
  files: { field: string; name: string; data: string }[],
  formData?: Record<string, string>
) => Promise<Response>;

export interface Network {
  request: Request;
  upload: Upload;
}

export interface Platform {
  name: string;
  network: Network;
}
