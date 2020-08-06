import {
  IFileProvider,
  IUploadFileInfo,
  IFile,
  IUploadOption,
} from '../../types';
import { Adapters, IUploadRequest, IHTTPResponse } from '../../Adapters';

export class Qiniu implements IFileProvider {
  upload(
    file: IFile,
    info: IUploadFileInfo,
    option?: IUploadOption
  ): Promise<IHTTPResponse> {
    const req: IUploadRequest = {
      method: 'POST',
      header: option.header,
      baseURL: info.url,
      form: {
        key: info.key,
        token: info.token,
        name: file.name,
      },
    };
    const fileForm = {
      field: 'file',
      name: file.name,
      data: file.data,
    };
    return Adapters.upload(req, fileForm, option);
  }
}
