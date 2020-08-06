import { LCObject, ObjectCreateTask } from './Object';
import { Query } from './Query';
import { IObjectAddOption, IObjectData, IClass, IObject, IApp } from '../types';

export class Class extends Query implements IClass {
  app: IApp;

  object(id: string): IObject {
    return new LCObject(this.className, id, this.app);
  }

  add(data: IObjectData, option?: IObjectAddOption): Promise<IObject> {
    return new ObjectCreateTask(this.app, this.className, data, option).do();
  }
}
