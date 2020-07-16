import { App } from '../../App';
import { IHTTPResponse } from '../../../adapters';
import {
  IFileProvider,
  IUploadFileInfo,
  IFile,
  IUploadOption,
} from '../../types';
import { HTTPRequest } from '../../utils';

export class AWSS3 implements IFileProvider {
  constructor(public app: App) {}

  upload(
    file: IFile,
    info: IUploadFileInfo,
    option?: IUploadOption
  ): Promise<IHTTPResponse> {
    const req = new HTTPRequest({
      method: 'PUT',
      baseURL: info.url,
      header: {
        'Content-Type': file.mime,
        'Cache-Control': 'public, max-age=31536000',
        ...option.header,
      },
      body: file.data,
    });
    return this.app._request(req, option);
  }
}
