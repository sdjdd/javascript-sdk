import { API } from '../../app/API';
import { File } from '../ObjectReference';
import { Network, Response } from '../../../platform';

export abstract class FileUploader {
  name: string;
  constructor(public api: API) {}
  abstract upload(file: File): Promise<Response>;
}

export class QiniuFileProvider {
  name = 'qiniu';
  constructor(public api: API, public network: Network) {}

  async upload(file: File, keepFileName = false): Promise<Response> {
    const uluruRes = await this.api.requestFileToken(file.key, file.name, {
      keepFileName,
      mime: file.mime,
    });

    const qiniuRes = await this.network.upload(
      uluruRes.upload_url,
      file.name,
      file.data,
      {
        name: file.name,
        key: uluruRes.key,
        token: uluruRes.token,
      }
    );

    return qiniuRes;
  }
}
