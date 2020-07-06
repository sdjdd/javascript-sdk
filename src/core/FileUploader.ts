import { File } from './storage/Object';
import { HTTPResponse } from './http';
import { App } from './App';
import { PlatformSupport } from './Platform';

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
    return PlatformSupport.getPlatform().network.upload(
      'POST',
      url,
      files,
      formData
    );
  }
}
