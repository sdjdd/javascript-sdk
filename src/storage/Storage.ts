import { Class } from './Class';
import { Qiniu, AWSS3 } from './file-provider';
import { Batch } from './Batch';
import {
  IFile,
  IFileProvider,
  IUploadOption,
  IFileTokens,
  IObject,
  IApp,
} from '../types';
import { LCObject } from './Object';
import { ObjectDecoder } from './ObjectEncoding';
import { User, UserClass } from './User';
import { ObjectFactory } from './ObjectFactory';
import { APIPath } from '../APIPath';
import { IHTTPResponse } from '../Adapters';
import { send } from '../http';

ObjectFactory.registerDefaultHandler(
  (className, objectId) => new LCObject(className, objectId)
);
ObjectFactory.registerHandler('_User', (objectId) => new User(objectId));

export class Storage {
  constructor(public app: IApp) {}

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
        return new Qiniu();
      case 's3':
        return new AWSS3();
      default:
        throw new Error('Unsupported file uploader: ' + name);
    }
  }

  async upload(file: IFile, option?: IUploadOption): Promise<IObject> {
    const res = await send(
      {
        method: 'POST',
        path: APIPath.fileTokens,
        body: {
          key: file.key,
          name: file.name,
          ACL: file.ACL,
          mime_type: file.mime,
          keep_file_name: option?.keepFileName || false,
          metaData: file.metaData,
        },
      },
      option
    ).to(this.app, option);
    const tokens = res.body as IFileTokens;

    const provider = this.getFileProvider(tokens.provider);
    const { mime_type, upload_url, key, token } = tokens;
    file.mime = mime_type;
    try {
      const info = { url: upload_url, key, token };
      await provider.upload(file, info, option);
      await this._invokeFileCallback(token);

      const obj = ObjectDecoder.decode(tokens, '_File').setApp(this.app);
      delete obj.data.token;
      return obj;
    } catch (err) {
      await this._invokeFileCallback(token, false);
      throw err;
    }
  }

  async _invokeFileCallback(
    token: string,
    success = true
  ): Promise<IHTTPResponse> {
    return await send({
      method: 'POST',
      path: APIPath.fileCallback,
      body: { token, result: success },
    }).to(this.app);
  }
}
