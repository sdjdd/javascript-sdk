import { App } from '../App';
import { IHTTPResponse, ProgressListener } from '../../adapters';
import { IFile } from '../types';
import { UploadRequest } from '../utils';

export class QiniuFileProvider {
  constructor(public app: App) {}

  upload(
    file: IFile,
    url: string,
    key: string,
    token: string,
    pl?: ProgressListener
  ): Promise<IHTTPResponse> {
    const _file = {
      field: 'file',
      name: file.name,
      data: file.base64Data,
    };
    const formData = {
      key,
      token,
      name: file.name,
    };
    const req = new UploadRequest({
      method: 'POST',
      baseURL: url,
      file: _file,
      formData,
    });
    return this.app._upload(req, pl);
  }
}
