import { LCObject } from './Object';
import { Query } from './Query';
import { App } from '../App';
import { IObjectAddOption, IObjectData, IObjectDataRaw } from '../types';
import { ObjectDecoder, ObjectEncoder } from './ObjectEncoding';
import { removeReservedKeys, HTTPRequest } from '../utils';

export class Class extends Query {
  app: App;

  object(id: string): LCObject {
    return new LCObject(this.className, id, this.app);
  }

  async add(data: IObjectData, option?: IObjectAddOption): Promise<LCObject> {
    removeReservedKeys(data);
    const req = new HTTPRequest({
      method: 'POST',
      path: '/1.1/classes/' + this.className,
      body: ObjectEncoder.encodeData(data),
    });
    if (option?.fetch) {
      req.query.fetchWhenSave = 'true';
    }
    const res = await this.app._uluru(req);

    const _data = res.body as IObjectDataRaw;
    const obj = ObjectDecoder.decode(_data, this.className) as LCObject;
    return obj.setApp(this.app);
  }
}
