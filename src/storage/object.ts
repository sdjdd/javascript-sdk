import { App } from '../app';

const readonlyAttrs = new Set(['objectId', 'createdAt', 'updatedAt']);

type Entry = string | Entry[];

export class AVObject {
  private _app: App;
  private _className: string;
  private _classURL: string;
  private _attrs: { [key: string]: Entry } = {};

  static extend(className: string): typeof AVObject {
    return new Proxy(AVObject, {
      construct: () => new AVObject(className),
    });
  }

  static createWithoutData(className: string, objectId: string): AVObject {
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

  get className(): string {
    return this._className;
  }
  get id(): string {
    return this._attrs.objectId as string;
  }
  get app(): App {
    if (this._app === undefined) {
      throw new Error(''); // TODO
    }
    return this._app;
  }
  get url(): string {
    return this._classURL + '/' + this.id;
  }

  set(key: string, value: Entry): this {
    if (readonlyAttrs.has(key)) {
      throw new Error('cannot set readonly attribute');
    }
    this._attrs[key] = value;
    return this;
  }

  get(key: string): Entry {
    return this._attrs[key];
  }

  async fetch(): Promise<this> {
    if (!this.has('objectId')) {
      throw new Error(''); // TODO
    }
    const client = this.app._httpClient;
    const { body } = await client.get(this.url);
    this._attrs = { ...body };
    return this;
  }

  async save(): Promise<this> {
    const client = this.app._httpClient;

    const data = { ...this._attrs };
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

  async destroy(): Promise<this> {
    const client = this._app._httpClient;
    await client.delete(this.url);
    return this;
  }

  bindApp(app: App): this {
    this._app = app;
    return this;
  }

  has(key: string): boolean {
    return this._attrs[key] !== undefined;
  }
}
