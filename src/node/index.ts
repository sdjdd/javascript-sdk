import { Platform, Network, KVStorage } from '../core/Platform';
import superagent from 'superagent';
import { HTTPRequest, HTTPResponse, parseHTTPRequestURL } from '../core/http';

const network: Network = {
  async request(req: HTTPRequest): Promise<HTTPResponse> {
    try {
      const superReq = superagent(req.method, parseHTTPRequestURL(req));
      if (req.header) {
        superReq.set(req.header);
      }
      if (req.body) {
        superReq.send(req.body as string | Record<string, unknown>);
      }
      const res = await superReq;
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
        body:
          Object.keys(err.response.body).length === 0
            ? err.response.text
            : err.response.body,
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

export class MemoryStorage implements KVStorage {
  map = new Map<string, string>();

  set(key: string, value: string): void {
    this.map.set(key, value);
  }

  get(key: string): string {
    return this.map.get(key);
  }

  remove(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}

export const node: Platform = {
  name: 'Node.js',
  network,
  storage: new MemoryStorage(),
};
