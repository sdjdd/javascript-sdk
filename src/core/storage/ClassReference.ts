import { Storage } from './Storage';
import { ObjectReference } from './ObjectReference';
import { Query } from './Query';

export class ClassReference extends Query {
  constructor(public name: string, public _storage: Storage) {
    super(name, _storage);
  }

  object(id?: string): ObjectReference {
    return new ObjectReference(this, id);
  }

  async add(data: Record<string, unknown>): Promise<ObjectReference> {
    const obj = this.object();
    await obj.set(data);
    return obj;
  }
}
