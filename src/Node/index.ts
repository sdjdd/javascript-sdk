import { Platform, Response, Network } from '../core/Platform';
import * as superagent from 'superagent';

const network: Network = {
  async request(
    method: string,
    url: string,
    headers: Record<string, string>,
    data?: unknown
  ): Promise<Response> {
    try {
      const res = await superagent(method, url)
        .set(headers)
        .send(data as string);
      return {
        status: res.status,
        headers: res.header,
        body: Object.keys(res.body).length === 0 ? res.text : res.body,
      };
    } catch (err) {
      if (!err.status || !err.response) {
        throw err;
      }
      return {
        status: err.status as number,
        headers: err.response.headers as Record<string, string | string[]>,
        body: err.response.text,
      };
    }
  },
  async upload(
    method: string,
    url: string,
    files: { field: string; name: string; data: string }[],
    formData?: Record<string, string>
  ) {
    const req = superagent(method, url);
    files.forEach((file) => {
      req.attach(file.field, Buffer.from(file.data, 'base64'), {
        filename: file.name,
        // contentType: ''
      });
    });
    const res = await req.field(formData);
    return {
      status: res.status,
      headers: res.header,
      body: res.body || res.text,
    };
  },
};

export const node: Platform = {
  name: 'Node.js',
  network,
};
