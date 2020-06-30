import { ObjectReference } from './ObjectReference';
import { Query } from './Query';
import { App } from '../app';

export class ClassReference extends Query {
  app: App;

  object(id?: string): ObjectReference {
    return new ObjectReference(this.app, this.className, id);
  }

  async add(data: Record<string, unknown>): Promise<ObjectReference> {
    const obj = this.object();
    await obj.set(data);
    return obj;
  }
}
