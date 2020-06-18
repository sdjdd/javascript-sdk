import { ObjectReference } from './ObjectReference';
import { Query } from './Query';

export class ClassReference extends Query {
  object(id?: string): ObjectReference {
    return new ObjectReference(this.api, this.className, id);
  }

  async add(data: Record<string, unknown>): Promise<ObjectReference> {
    const obj = this.object();
    await obj.set(data);
    return obj;
  }
}
