import { App } from '../App';
import { IHTTPResponse, IUploadOption } from '../../adapters';
import { IFileProvider, IUploadFileInfo, IFile } from '../types';
import { UploadRequest } from '../utils';

export class QiniuFileProvider implements IFileProvider {
  constructor(public app: App) {}

  upload(
    file: IFile,
    info: IUploadFileInfo,
    option?: IUploadOption
  ): Promise<IHTTPResponse> {
    const _file = {
      field: 'file',
      name: file.name,
      data: file.base64Data,
    };
    const formData = {
      key: info.key,
      token: info.token,
      name: file.name,
    };
    const req = new UploadRequest({
      method: 'POST',
      baseURL: info.url,
      file: _file,
      formData,
    });
    return this.app._upload(req, option);
  }
}
