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

export interface Platform {
  userAgent: string;
  request: Request;
  upload(
    url: string,
    name: string,
    data: string,
    formData?: Record<string, string>
  );
}
