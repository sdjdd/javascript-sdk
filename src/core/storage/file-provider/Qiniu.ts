import { App } from '../../App';
import { IHTTPResponse, IRequestOption } from '../../../adapters';
import { IFileProvider, IUploadFileInfo, IFile } from '../../types';
import { UploadRequest } from '../../utils';

export class Qiniu implements IFileProvider {
  constructor(public app: App) {}

  upload(
    file: IFile,
    info: IUploadFileInfo,
    option?: IRequestOption
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
      baseURL: info.url,
      file: _file,
      formData,
    });
    return this.app._upload(req, option);
  }
}
