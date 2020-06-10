import { App } from './app';

export const KEY_CREATED_AT = 'createdAt';
export const KEY_UPDATED_AT = 'updatedAt';
export const KEY_OBJECT_ID = 'objectId';

const RESERVED_KEYS = new Set([KEY_CREATED_AT, KEY_UPDATED_AT, KEY_OBJECT_ID]);

export interface AVObjectInitOptions {
  className: string;
  app: App;
}

export class AVObject {
  public app: App;

  protected _className: string;

  protected _savedAttrs: Record<string, unknown> = {};
  protected _unsavedAttrs: Record<string, unknown> = {};
  protected _operations: Record<string, unknown> = {};

  constructor(className: string, app?: App) {
    this._className = className;
    this.app = app;
  }

  get id(): string {
    return this.get(KEY_OBJECT_ID) as string;
  }

  set(key: string, value: unknown): this {
    if (RESERVED_KEYS.has(key)) {
      if (key === KEY_OBJECT_ID) {
        if (Object.keys(this._savedAttrs).length > 0) {
          throw new Error(''); // TODO: error message
        }
      } else {
        throw new Error(''); // TODO: error message
      }
    }
    this._unsavedAttrs[key] = value;
    return this;
  }

  get(key: string): unknown {
    let value = this._unsavedAttrs[key];
    if (value === undefined) {
      value = this._savedAttrs[key];
    }
    return value;
  }

  marshal(onlyUnsavedAttrs = false): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    if (onlyUnsavedAttrs) {
      Object.assign(data, this._unsavedAttrs);
    } else {
      Object.assign(data, this._savedAttrs, this._unsavedAttrs);
    }
    return data;
  }

  revert(keys?: string[]): this {
    if (keys) {
      keys.forEach((key) => delete this._unsavedAttrs[key]);
    } else {
      this._unsavedAttrs = {};
    }
    return this;
  }

  async fetch(keys?: string[]): Promise<this> {
    const serverData = await this.app._client.getObject(
      this._className,
      this.id
    );

    if (keys) {
      keys.forEach((key) => (this._savedAttrs[key] = serverData[key]));
    } else {
      this._savedAttrs = serverData;
    }

    return this;
  }

  async save(fetchWhenSave = false): Promise<this> {
    if (this.app === undefined) {
      throw Error(''); // TODO: error message
    }

    let serverData: Record<string, unknown>;
    if (this.id === undefined) {
      serverData = await this.app._client.createObject(
        this._className,
        this.marshal(),
        fetchWhenSave
      );
    } else {
      serverData = await this.app._client.updateObject(
        this._className,
        this.marshal(),
        fetchWhenSave
      );
    }

    if (fetchWhenSave) {
      this._savedAttrs = serverData;
    } else {
      Object.assign(this._savedAttrs, this._unsavedAttrs, serverData);
    }
    this.revert();

    return this;
  }
}
