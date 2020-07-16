import { LCObject } from './Object';
import { Query } from './Query';
import { App } from '../App';
import { IObjectAddOption, IObjectData, IClass, IObject } from '../types';
import { ObjectDecoder, ObjectEncoder } from './ObjectEncoding';
import { removeReservedKeys, HTTPRequest } from '../utils';

export class Class extends Query implements IClass {
  app: App;

  object(id: string): IObject {
    return new LCObject(this.className, id, this.app);
  }

  async add(data: IObjectData, option?: IObjectAddOption): Promise<IObject> {
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
    return ObjectDecoder.decode(res.body, this.className).setApp(this.app);
  }
}
