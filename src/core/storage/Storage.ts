import { Class } from './Class';
import { QiniuFileProvider, AWSS3FileProvider } from './file-providers';
import { App } from '../App';
import { Batch } from './Batch';
import { IFile, IFileProvider, IUploadOption, IFileTokens } from '../types';
import { IHTTPResponse } from '../../adapters';
import { HTTPRequest } from '../utils';
import { LCObject } from './Object';
import { ObjectDecoder } from './ObjectEncoding';
import { User, UserClass } from './User';
import { ObjectFactory } from './ObjectFactory';

ObjectFactory.registerDefaultHandler(
  (className, objectId) => new LCObject(className, objectId)
);
ObjectFactory.registerHandler('_User', (objectId) => new User(objectId));

export class Storage {
  constructor(public app: App) {}

  class(name: string): Class {
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

  async upload(file: IFile, option?: IUploadOption): Promise<LCObject> {
    const req = new HTTPRequest({
      method: 'POST',
      path: '/1.1/fileTokens',
      body: {
        key: file.key,
        name: file.name,
        ACL: file.ACL,
        mime_type: file.mime,
        keep_file_name: option?.keepFileName || false,
        metaData: file.metaData,
      },
    });
    const res = await this.app._uluru(req, option);
    const tokens = res.body as IFileTokens;

    const provider = this.getFileProvider(tokens.provider);
    const { mime_type, upload_url, key, token } = tokens;
    file.mime = mime_type;
    try {
      const info = { url: upload_url, key, token };
      await provider.upload(file, info, option);
      await this._invokeFileCallback(token);

      const obj = ObjectDecoder.decode(tokens, '_File') as LCObject;
      delete obj.data.token;
      return obj.setApp(this.app);
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
