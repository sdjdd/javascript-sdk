import { ObjectReference, ObjectAttributes } from './Object';
import { Query } from './Query';
import { App } from '../app';
import { HTTPRequest } from '../http';

export class ClassReference extends Query {
  app: App;

  object(id: string): ObjectReference {
    return new ObjectReference(this.app, this.className, id);
  }

  async add(data: Record<string, unknown>): Promise<ObjectReference> {
    const req = new HTTPRequest({
      method: 'POST',
      path: '/1.1/classes/' + this.className,
      body: data,
    });
    const res = (await this.app._doRequest(req)) as ObjectAttributes;
    return this.object(res.objectId);
  }
}
