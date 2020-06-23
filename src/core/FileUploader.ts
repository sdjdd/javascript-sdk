import { API } from './API';
import { File } from './ObjectReference';
import { Response } from './Platform';

export abstract class FileUploader {
  constructor(public api: API) {}

  abstract upload(
    file: File,
    url: string,
    key: string,
    token: string
  ): Promise<Response>;
}

export class QiniuFileProvider extends FileUploader {
  upload(
    file: File,
    url: string,
    key: string,
    token: string
  ): Promise<Response> {
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
    return this.api.network.upload('POST', url, files, formData);
  }
}
