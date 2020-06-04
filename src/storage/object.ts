import { App } from '../app';

const readonlyAttrs = new Set(['objectId', 'createdAt', 'updatedAt']);

export class AVObject {
  private _app: App;
  private _className: string;
  private _classURL: string;
  private _attrs: { [key: string]: any } = {};

  static extend(className: string) {
    return new Proxy(AVObject, {
      construct: () => new AVObject(className),
    });
  }

  static createWithoutData(className: string, objectId: string) {
    const obj = new AVObject(className);
    obj._attrs.objectId = objectId;
    return obj;
  }

  constructor(className?: string) {
    if (className === undefined) {
      throw new TypeError('className must be provided');
    }
    this._className = className;
    this._classURL = `/1.1/classes/${this.className}`;
  }

  get className() {
    return this._className;
  }
  get id() {
    return this._attrs.objectId;
  }
  get app() {
    if (this._app === undefined) {
      throw new Error(''); // TODO
    }
    return this._app;
  }
  get url() {
    return this._classURL + '/' + this.id;
  }

  set(key: string, value: any) {
    if (readonlyAttrs.has(key)) {
      throw new Error('cannot set readonly attribute');
    }
    this._attrs[key] = value;
    return this;
  }

  get(key: string) {
    return this._attrs[key];
  }

  async fetch() {
    if (!this.has('objectId')) {
      throw new Error(''); // TODO
    }
    const client = this.app._httpClient;
    const { body } = await client.get(this.url);
    this._attrs = { ...body };
    return this;
  }

  async save() {
    const client = this.app._httpClient;

    let data = { ...this._attrs };
    readonlyAttrs.forEach((name) => delete data[name]);

    if (this.has('objectId')) {
      const { body } = await client.put(this.url, data);
      this._attrs.updatedAt = body.updatedAt;
    } else {
      const { body } = await client.post(this._classURL, data);
      Object.assign(this._attrs, body);
    }
    return this;
  }

  async destroy() {
    const client = this._app._httpClient;
    await client.delete(this.url);
    return this;
  }

  bindApp(app: App) {
    this._app = app;
    return this;
  }

  has(key: string) {
    return this._attrs[key] !== undefined;
  }
}
