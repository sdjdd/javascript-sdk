import { App } from '../app';

type Entry = string;

export class AVObject {
  private _app: App;
  private _className: string;
  private _classURL: string;
  private _attrs: Record<string, Entry> = {};

  constructor(className: string) {
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

  isEmpty(): boolean {
    return Object.keys(this._attrs).length === 0;
  }

  set(key: string, value: Entry): this {
    if (key === 'createdAt' || key === 'updatedAt') {
      throw new Error('Cannot set readonly attribute');
    }
    if (key === 'objectId' && !this.isEmpty()) {
      throw new Error('"objectId" can only be set for empty object');
    }
    this._attrs[key] = value;
    return this;
  }

  get(key: string): Entry {
    return this._attrs[key];
  }

  entries(): [string, Entry][] {
    return Object.entries(this._attrs);
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
    delete data.createdAt;
    delete data.updatedAt;

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
