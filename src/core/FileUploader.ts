import { File } from './storage/Object';
import { App } from './App';
import { PlatformSupport } from './Platform';
import { IHTTPResponse } from '../adapters';

export abstract class FileUploader {
  constructor(public app: App) {}

  abstract upload(
    file: File,
    url: string,
    key: string,
    token: string
  ): Promise<IHTTPResponse>;
}

export class QiniuFileProvider extends FileUploader {
  upload(
    file: File,
    url: string,
    key: string,
    token: string
  ): Promise<IHTTPResponse> {
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
    return PlatformSupport.getPlatform().upload('POST', url, files, formData);
  }
}
