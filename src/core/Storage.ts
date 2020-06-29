import { ClassReference } from './ClassReference';
import { API } from './API';
import { FileUploader, QiniuFileProvider } from './FileUploader';
import { File } from './ObjectReference';
import { UserClassReference } from './User';
import { App } from './app';
import { HTTPResponse } from './http';
import { Env } from './Env';

export { ObjectReference } from './ObjectReference';

export interface Operation {
  __op: string;
  [key: string]: unknown;
}

export class Value {
  static delete(): Operation {
    return { __op: 'Delete' };
  }

  static increment(amount = 1): Operation {
    return { __op: 'Increment', amount };
  }

  static decrement(amount = 1): Operation {
    return { __op: 'Decrement', amount };
  }

  static add(objects: unknown[]): Operation {
    return { __op: 'Add', objects };
  }

  static addUnique(objects: unknown[]): Operation {
    return { __op: 'AddUnique', objects };
  }

  static remove(objects: unknown[]): Operation {
    return { __op: 'Remove', objects };
  }
}

export class Storage {
  static Value = new Value();

  app: App;
  User: UserClassReference;

  constructor(app?: App) {
    this.app = app ?? Env.getDefaultApp();
  }

  Class(name: string): ClassReference {
    if (name == '_User') {
      return this.User;
    }
    const cls = new ClassReference(name, this.app);
    cls.app = this.app;
    return cls;
  }

  getFileProvider(name: string): FileUploader {
    switch (name) {
      case 'qiniu':
        return new QiniuFileProvider(this.app);
      default:
        throw new Error('Unsupported file uploader: ' + name);
    }
  }

  // async upload(file: File, keepFileName = false): Promise<HTTPResponse> {
  //   const tokens = await this.api.getFileTokens(file.key, file.name, {
  //     keepFileName,
  //     mime: file.mime,
  //   });
  //   const provider = this.getFileProvider(tokens.provider);
  //   const { upload_url, key, token } = tokens;

  //   let res: HTTPResponse;
  //   let result = false;
  //   let qiniuError: unknown;
  //   try {
  //     res = await provider.upload(file, upload_url, key, token);
  //     file.objectId = tokens.objectId;
  //     result = true;
  //   } catch (err) {
  //     qiniuError = err;
  //   }
  //   await this.api.handleFileCallback(token, result);

  //   if (!result) {
  //     throw qiniuError;
  //   }
  //   return res;
  // }
}

export class GeoPoint {
  __type = 'GeoPoint';
  constructor(public latitude: number, public longitude: number) {}
}

export class Pointer {
  __type = 'Pointer';
  constructor(public className: string, public objectId: string) {}
}
