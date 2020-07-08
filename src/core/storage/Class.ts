import { LCObject } from './Object';
import { Query } from './Query';
import { App } from '../App';
import { PlatformSupport } from '../Platform';
import { checkUluruResponse } from '../utils';
import { IObjectData, IClass, IClassAddOption, IObject } from '../types';
import { ObjectDecoder } from './encoding';

export class Class extends Query implements IClass {
  app: App;

  object(id: string): LCObject {
    return new LCObject(this.app, this.className, id);
  }

  async add(data: IObjectData, option?: IClassAddOption): Promise<IObject> {
    const req = this.app._makeBaseRequest(
      'POST',
      '/1.1/classes/' + this.className
    );
    req.body = data;
    if (option?.fetch) {
      req.query = { fetchWhenSave: 'true' };
    }

    const platform = PlatformSupport.getPlatform();
    const res = await platform.network.request(req);
    checkUluruResponse(res);

    return ObjectDecoder.decode(res.body as IObjectData, this.app);
  }
}
