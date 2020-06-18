import { API } from '../../app/API';
import { File } from '../ObjectReference';
import { Platform } from '../../Platform';

export abstract class FileUploader {
  name: string;
  constructor(public api: API) {}
  abstract upload(file: File);
}

export class QiniuFileProvider {
  name = 'qiniu';
  constructor(public api: API, public platform: Platform) {}

  async upload(file: File, keepFileName = false) {
    const uluruRes = await this.api.requestFileToken(file.key, file.name, {
      keepFileName,
      mime: file.mime,
    });

    const qiniuRes = await this.platform.upload(
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
