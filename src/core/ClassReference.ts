import { ObjectReference } from './ObjectReference';
import { Query } from './Query';
import { App } from './app';

export class ClassReference extends Query {
  app: App;

  object(id?: string): ObjectReference {
    const obj = new ObjectReference(this.api, this.className, id);
    obj.app = this.app;
    return obj;
  }

  async add(data: Record<string, unknown>): Promise<ObjectReference> {
    const obj = this.object();
    await obj.set(data);
    return obj;
  }
}
