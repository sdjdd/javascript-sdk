import { AppInfo } from '../core/app';
import { HTTPClient } from '../core/http';
import { NodeHTTPClient } from '../platforms/Node/HTTPClient';

export class Operation {
  private _data: Record<string, unknown> = {};

  constructor(name: string, extra?: unknown) {
    const extraKey = {
      Add: 'objects',
      AddUnique: 'objects',
      Remove: 'objects',
      Increment: 'amount',
      Decrement: 'amount',
    };
    this._data.__op = name;
    if (extraKey[name]) {
      this._data[extraKey[name]] = extra;
    }
  }

  toString(): string {
    return JSON.stringify(this);
  }
  toJSON(): Record<string, unknown> {
    return this._data;
  }
}

export class AVObject {
  private _className: string;
  private _classURL: string;
  private _attrs: Record<string, unknown> = {};
  private _unsavedAttrs: Record<string, unknown> = {};
  private _httpClient: HTTPClient;

  constructor(options: {
    className: string;
    httpClient?: HTTPClient;
    appInfo?: AppInfo;
  }) {
    this._className = options.className;
    this._classURL = `/1.1/classes/${this.className}`;

    if (options.httpClient) {
      this._httpClient = options.httpClient;
    } else if (options.appInfo) {
      this._httpClient = new NodeHTTPClient(options.appInfo);
    } else {
      throw new Error('appInfo of httpClient must be provided');
    }
  }

  get className(): string {
    return this._className;
  }
  get id(): string {
    return this._attrs.objectId as string;
  }
  get url(): string {
    return this._classURL + '/' + this.id;
  }

  isEmpty(): boolean {
    return Object.keys(this._attrs).length === 0;
  }

  set(key: string, value: unknown): this {
    if (key === 'createdAt' || key === 'updatedAt') {
      throw new Error('Cannot set readonly attribute');
    }
    if (key === 'objectId' && !this.isEmpty()) {
      throw new Error('"objectId" can only be set for empty object');
    }
    this._unsavedAttrs[key] = value;
    return this;
  }

  get(key: string): unknown {
    if (this._unsavedAttrs[key] !== undefined) {
      this._unsavedAttrs[key];
    }
    return this._attrs[key];
  }

  has(key: string): boolean {
    return (
      this._unsavedAttrs[key] !== undefined || this._attrs[key] !== undefined
    );
  }

  dirtyKeys(): string[] {
    return Object.keys(this._unsavedAttrs);
  }

  revert(keys: string[]): this {
    if (keys === undefined) {
      this._unsavedAttrs = {};
    } else {
      keys.forEach((key) => delete this._unsavedAttrs[key]);
    }
    return this;
  }

  async fetch(): Promise<this> {
    if (!this.has('objectId')) {
      throw new Error('cannot fetch object without objectId');
    }
    const { body } = await this._httpClient.get(this.url);
    this._attrs = { ...body };
    return this;
  }

  async save(): Promise<this> {
    const data = { ...this._attrs };
    delete data.createdAt;
    delete data.updatedAt;

    if (this.has('objectId')) {
      return this._updateAndFetch(data);
    } else {
      const { body } = await this._httpClient.post(this._classURL, data);
      Object.assign(this._attrs, body);
    }
    return this;
  }

  private async _update(
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const url = this.url + '?fetchWhenSave=true';
    const { body } = await this._httpClient.put(url, data);
    return body;
  }

  private async _updateAndFetch(data: Record<string, unknown>): Promise<this> {
    const updated = await this._update(data);
    Object.assign(this._attrs, updated);
    return this;
  }

  private _addOp(
    key: string,
    op: string,
    extra?: Record<string, unknown>
  ): this {
    return this;
  }

  async destroy(): Promise<this> {
    await this._httpClient.delete(this.url);
    return this;
  }

  async increment(key: string, value = 1): Promise<this> {
    return this._updateAndFetch({
      [key]: {
        __op: 'Increment',
        amount: value,
      },
    });
  }

  async decrement(key: string, value = 1): Promise<this> {
    return this._updateAndFetch({
      [key]: {
        __op: 'Decrement',
        amount: value,
      },
    });
  }

  async appendArray(
    key: string,
    items: unknown[],
    unique = false
  ): Promise<this> {
    return this._updateAndFetch({
      [key]: {
        __op: unique ? 'AddUnique' : 'Add',
        objects: items,
      },
    });
  }

  async removeArray(key: string, items: unknown[]): Promise<this> {
    return this._updateAndFetch({
      [key]: {
        __op: 'Remove',
        objects: items,
      },
    });
  }

  async unset(key: string): Promise<unknown> {
    const updated = await this._update({
      [key]: {
        __op: 'Delete',
      },
    });
    if (updated[key] === undefined) {
      delete this._attrs[key];
    }
    Object.assign(this._attrs, updated);
    return this;
  }
}
