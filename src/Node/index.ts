import { Platform, Network } from '../core/Platform';
import superagent from 'superagent';
import { HTTPRequest, HTTPResponse } from '../core/http';

const network: Network = {
  async request(req: HTTPRequest): Promise<HTTPResponse> {
    try {
      const res = await superagent(req.method, req.url)
        .set(req.header)
        .send(req.body as string);
      return {
        status: res.status,
        header: res.header,
        body: Object.keys(res.body).length === 0 ? res.text : res.body,
      };
    } catch (err) {
      if (!err.status || !err.response) {
        throw err;
      }
      return {
        status: err.status as number,
        header: err.response.headers as Record<string, string | string[]>,
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
      header: res.header,
      body: res.body || res.text,
    };
  },
};

export const node: Platform = {
  name: 'Node.js',
  network,
};
