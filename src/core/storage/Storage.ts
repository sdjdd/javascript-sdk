import { Class, UserClass } from './Class';
import { FileUploader, QiniuFileProvider } from '../FileUploader';
import { File } from './Object';
import { App } from '../App';
import { HTTPResponse } from '../http';
import { Batch } from './Batch';
import { IClass } from '../types';

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

  getFileProvider(name: string): FileUploader {
    switch (name) {
      case 'qiniu':
        return new QiniuFileProvider(this.app);
      default:
        throw new Error('Unsupported file uploader: ' + name);
    }
  }

  // async upload(file: File, keepFileName = false): Promise<HTTPResponse> {
  //   const tokens = await this.api.getFileTokens(file.key, file.name, {
  //     keepFileName,
  //     mime: file.mime,
  //   });
  //   const provider = this.getFileProvider(tokens.provider);
  //   const { upload_url, key, token } = tokens;

  //   let res: HTTPResponse;
  //   let result = false;
  //   let qiniuError: unknown;
  //   try {
  //     res = await provider.upload(file, upload_url, key, token);
  //     file.objectId = tokens.objectId;
  //     result = true;
  //   } catch (err) {
  //     qiniuError = err;
  //   }
  //   await this.api.handleFileCallback(token, result);

  //   if (!result) {
  //     throw qiniuError;
  //   }
  //   return res;
  // }
}
