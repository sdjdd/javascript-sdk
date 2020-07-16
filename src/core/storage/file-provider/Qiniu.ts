import { App } from '../../App';
import { IHTTPResponse } from '../../../adapters';
import {
  IFileProvider,
  IUploadFileInfo,
  IFile,
  IUploadOption,
} from '../../types';
import { UploadRequest } from '../../utils';

export class Qiniu implements IFileProvider {
  constructor(public app: App) {}

  upload(
    file: IFile,
    info: IUploadFileInfo,
    option?: IUploadOption
  ): Promise<IHTTPResponse> {
    const _file = {
      field: 'file',
      name: file.name,
      data: file.data,
    };
    const formData = {
      key: info.key,
      token: info.token,
      name: file.name,
    };
    const req = new UploadRequest({
      method: 'POST',
      header: option.header,
      baseURL: info.url,
      file: _file,
      formData,
    });
    return this.app._upload(req, option);
  }
}
