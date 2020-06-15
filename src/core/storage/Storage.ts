import { App } from '../app/app';
import { ClassReference } from './ClassReference';

export class Storage {
  app: App;

  constructor(app?: App) {
    this.app = app;
  }

  Class(name: string): ClassReference {
    return new ClassReference(name, this);
  }
}
