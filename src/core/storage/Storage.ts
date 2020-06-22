import { ClassReference } from './ClassReference';
import { Value } from './Value';
import { API } from '../app/API';

export class Storage {
  static Value = new Value();

  constructor(public api: API) {}

  Class(name: string): ClassReference {
    return new ClassReference(name, this.api);
  }
}
