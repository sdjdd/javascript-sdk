import { ClassReference } from './ClassReference';
import { Value } from './Value';
import { API } from './API';
import { FileUploader, QiniuFileProvider } from './FileUploader';
import { File } from './ObjectReference';
import { Response } from './Platform';

export class Storage {
  static Value = new Value();

  constructor(public api: API) {}

  Class(name: string): ClassReference {
    return new ClassReference(name, this.api);
  }

  getFileProvider(name: string): FileUploader {
    switch (name) {
      case 'qiniu':
        return new QiniuFileProvider(this.api);
      default:
        throw new Error('Unsupported file uploader: ' + name);
    }
  }

  async upload(file: File, keepFileName = false): Promise<Response> {
    const tokens = await this.api.getFileTokens(file.key, file.name, {
      keepFileName,
      mime: file.mime,
    });
    const provider = this.getFileProvider(tokens.provider);
    const { upload_url, key, token } = tokens;

    let res: Response;
    let result = false;
    let qiniuError: unknown;
    try {
      res = await provider.upload(file, upload_url, key, token);
      file.objectId = tokens.objectId;
      result = true;
    } catch (err) {
      qiniuError = err;
    }
    await this.api.handleFileCallback(token, result);

    if (!result) {
      throw qiniuError;
    }
    return res;
  }
}
