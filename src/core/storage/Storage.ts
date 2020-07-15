import { Class, UserClass } from './Class';
import { QiniuFileProvider, AWSS3FileProvider } from './file-providers';
import { App } from '../App';
import { Batch } from './Batch';
import { IClass, IFile, IFileProvider, IUploadOption } from '../types';
import { IHTTPResponse } from '../../adapters';
import { HTTPRequest } from '../utils';

export class Storage {
  constructor(public app: App) {}

  class(name: string): IClass {
    return new Class(this.app, name);
  }

  user(): UserClass {
    return new UserClass(this.app);
  }

  batch(): Batch {
    return new Batch(this.app);
  }

  getFileProvider(name: string): IFileProvider {
    switch (name) {
      case 'qiniu':
        return new QiniuFileProvider(this.app);
      case 's3':
        return new AWSS3FileProvider(this.app);
      default:
        throw new Error('Unsupported file uploader: ' + name);
    }
  }

  async upload(file: IFile, option?: IUploadOption): Promise<IHTTPResponse> {
    const req = new HTTPRequest({
      method: 'POST',
      path: '/1.1/fileTokens',
      body: {
        key: file.key,
        name: file.name,
        ACL: undefined,
        mime_type: file.mime,
        keep_file_name: option?.keepFileName || false,
        metaData: undefined, // metaData is not necessary
      },
    });
    const res = await this.app._uluru(req, option);
    const tokens = res.body as Record<string, string>;

    const provider = this.getFileProvider(tokens.provider);
    const { mime_type, upload_url, key, token } = tokens;
    file.mime = mime_type;
    try {
      const info = { url: upload_url, key, token };
      const providerRes = await provider.upload(file, info, option);
      file.objectId = tokens.objectId;
      await this._invokeFileCallback(token);
      return providerRes;
    } catch (err) {
      await this._invokeFileCallback(token, false);
      throw err;
    }
  }

  _invokeFileCallback(token: string, success = true): Promise<IHTTPResponse> {
    return this.app._uluru(
      new HTTPRequest({
        method: 'POST',
        path: '/1.1/fileCallback',
        body: { token, result: success },
      })
    );
  }
}
