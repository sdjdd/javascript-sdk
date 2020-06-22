import { Platform, Response, Network } from '../platform';
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
        body: res.body || res.text,
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

export const node: Platform = {
  name: 'Node.js',
  network,
};
