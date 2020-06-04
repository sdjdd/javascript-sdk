import { App } from '../app';
import { AVObject } from './object';

export class LeanStorage {
  private _app: App;
  private _className: string;

  constructor(app: App, className: string) {
    this._app = app;
    this._className = className;
  }

  create() {
    const obj = new AVObject(this._className);
    obj.bindApp(this._app);
    return obj;
  }

  fetch(objectId: string) {
    const obj = AVObject.createWithoutData(this._className, objectId);
    obj.bindApp(this._app);
    return obj.fetch();
  }
}
