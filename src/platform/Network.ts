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
  data: string,
  formData?: Record<string, string>
) => Promise<Response>;

export interface Network {
  request: Request;
  upload: Upload;
}
