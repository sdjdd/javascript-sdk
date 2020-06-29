import { File } from './ObjectReference';
import { HTTPResponse } from './http';
import { App } from './app';

export abstract class FileUploader {
  constructor(public app: App) {}

  abstract upload(
    file: File,
    url: string,
    key: string,
    token: string
  ): Promise<HTTPResponse>;
}

export class QiniuFileProvider extends FileUploader {
  upload(
    file: File,
    url: string,
    key: string,
    token: string
  ): Promise<HTTPResponse> {
    const files = [
      {
        field: 'file',
        name: file.name,
        data: file.data,
      },
    ];
    const formData = {
      key,
      token,
      name: file.name,
    };
    return this.app.platform.network.upload('POST', url, files, formData);
  }
}
