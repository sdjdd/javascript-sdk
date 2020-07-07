import { LCObject } from './Object';
import { Query } from './Query';
import { App } from '../App';
import { PlatformSupport } from '../Platform';
import { checkUluruResponse } from '../utils';
import { IObjectData, IClass, IClassAddOption } from '../types';

export class Class extends Query implements IClass {
  app: App;

  object(id: string): LCObject {
    return new LCObject(this.app, this.className, id);
  }

  async add(data: IObjectData, option?: IClassAddOption): Promise<LCObject> {
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

    const attr = res.body as IObjectData;
    const obj = this.object(attr.objectId);
    obj.data = attr;
    LCObject.decode(obj.data, this.app);
    return obj;
  }
}
