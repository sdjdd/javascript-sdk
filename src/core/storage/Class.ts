import { ObjectReference, ObjectAttributes } from './Object';
import { Query } from './Query';
import { App } from '../App';
import { PlatformSupport } from '../Platform';
import { checkUluruResponse } from '../utils';

export interface ClassAddObjectOption {
  fetch?: boolean;
}

export class Class extends Query {
  app: App;

  object(id: string): ObjectReference {
    return new ObjectReference(this.app, this.className, id);
  }

  async add(
    data: Record<string, unknown>,
    option?: ClassAddObjectOption
  ): Promise<ObjectReference> {
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

    const attr = res.body as ObjectAttributes;
    const obj = this.object(attr.objectId);
    obj.data = attr;
    ObjectReference.decodeAdvancedType(this.app, obj.data);
    return obj;
  }
}
