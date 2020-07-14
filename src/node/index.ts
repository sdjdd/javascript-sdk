import superagent from 'superagent';

import {
  IHTTPRequest,
  IHTTPResponse,
  IAbortable,
  IKVStorage,
  IPlatform,
  IFileData,
  IUploadRequest,
  ProgressListener,
} from '../adapters';

async function request(
  req: IHTTPRequest,
  option?: IAbortable
): Promise<IHTTPResponse> {
  try {
    const superReq = superagent(req.method, req.url);
    if (req.header) {
      superReq.set(req.header);
    }
    if (req.body) {
      superReq.send(req.body as string | Record<string, unknown>);
    }

    if (option?.signal) {
      option.signal.onabort = superReq.abort;
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
}

async function upload(
  req: IUploadRequest,
  progressListener?: ProgressListener
): Promise<IHTTPResponse> {
  const superReq = superagent(req.method, req.url);

  let files: IFileData[];
  if (Array.isArray(req.file)) {
    files = req.file;
  } else {
    files = [req.file];
  }

  files.forEach((file) => {
    let fileData: Buffer;
    if (typeof file.data === 'string') {
      fileData = Buffer.from(file.data, 'base64');
    } else {
      fileData = Buffer.from(file.data);
    }
    superReq.attach(file.field, fileData, {
      filename: file.name,
      // contentType: ''
    });
  });

  if (progressListener) {
    superReq.on('progress', progressListener);
  }

  // eslint-disable-next-line
  const res = await superReq.field(req.formData as any);
  return {
    status: res.status,
    header: res.header,
    body: Object.keys(res.body) ? res.body : res.text,
  };
}

export class MemoryStorage implements IKVStorage {
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

export const node: IPlatform = {
  name: 'Node.js',
  request,
  upload,
  storage: new MemoryStorage(),
};
