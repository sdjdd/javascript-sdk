import { Class } from './Class';
import { FileUploader, QiniuFileProvider } from '../FileUploader';
import { File, LCGeoPoint } from './Object';
import { UserClassReference } from '../user/User';
import { App } from '../app';
import { HTTPResponse } from '../http';
import { defaultApp } from '../global';
import { Batch } from './Batch';

export class Storage {
  User: UserClassReference;

  constructor(public app: App) {}

  class(name: string): Class {
    if (name == '_User') {
      return this.User;
    }
    return new Class(name, this.app);
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

export const storage = new Storage(defaultApp);
