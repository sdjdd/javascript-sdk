import { Platform, Response } from '../core/Platform';
import * as superagent from 'superagent';

export const node: Platform = {
  userAgent: 'Node.js',
  async request(
    method: string,
    url: string,
    headers: Record<string, string>,
    data?: unknown
  ): Promise<Response> {
    const res = await superagent(method, url)
      .set(headers)
      .send(data as string);
    return {
      status: res.status,
      headers: res.header,
      body: res.body || res.text,
    };
  },
  async upload(
    url: string,
    name: string,
    data: string,
    formData?: Record<string, string>
  ) {
    const res = await superagent
      .post(url)
      .attach('file', Buffer.from(data, 'base64'), {
        filename: name,
      })
      .field(formData);
    return {
      status: res.status,
      headers: res.header,
      body: res.body || res.text,
    };
  },
};
