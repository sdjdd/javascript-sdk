import { App } from '../../App';
import {
  IFileProvider,
  IUploadFileInfo,
  IFile,
  IUploadOption,
} from '../../types';
import { Adapters, IHTTPResponse } from '../../Adapters';

export class AWSS3 implements IFileProvider {
  constructor(public app: App) {}

  upload(
    file: IFile,
    info: IUploadFileInfo,
    option?: IUploadOption
  ): Promise<IHTTPResponse> {
    return Adapters.request(
      {
        method: 'PUT',
        baseURL: info.url,
        header: {
          'Content-Type': file.mime,
          'Cache-Control': 'public, max-age=31536000',
          ...option.header,
        },
        body: file.data as any,
      },
      option
    );
  }
}
