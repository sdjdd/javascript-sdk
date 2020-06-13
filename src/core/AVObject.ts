import { App } from './app';
import {
  Operation,
  AddOperation,
  AddUniqueOperation,
  IncrementOperation,
  DeleteOperation,
} from './operations';

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
  protected _objectId: string;
  protected _savedAttrs: Record<string, unknown> = {};
  protected _unsavedAttrs: Record<string, unknown> = {};
  protected _operations: Record<string, Operation> = {};

  constructor(className: string, app?: App) {
    this._className = className;
    this.app = app;
  }

  get id(): string {
    return this.get(KEY_OBJECT_ID) as string;
  }
  set id(objectId: string) {
    this.set(KEY_OBJECT_ID, objectId);
  }

  set(key: string, value: unknown): this {
    if (RESERVED_KEYS.has(key)) {
      if (key !== KEY_OBJECT_ID || Object.keys(this._savedAttrs).length > 0) {
        throw new Error('this AVObject is not empty');
      }
    }

    if (value === undefined) {
      delete this._unsavedAttrs[key];
    } else {
      this._unsavedAttrs[key] = value;
    }

    delete this._operations[key];
    return this;
  }

  get(key: string, defaultValue?: unknown): unknown {
    let value = this._unsavedAttrs[key];
    if (value !== undefined) {
      return value;
    }
    value = this._savedAttrs[key];
    if (value !== undefined) {
      return value;
    }
    return defaultValue;
  }

  has(key: string): boolean {
    return (
      this._unsavedAttrs[key] !== undefined ||
      this._savedAttrs[key] !== undefined
    );
  }

  private _addOperation(key: string, op: Operation) {
    if (this._operations[key] !== undefined) {
      throw new Error(
        'Conflict with unsaved operation, please save or revert before adding a new operation'
      );
    }
    this._operations[key] = op;
  }

  increment(key: string, amount = 1): this {
    this._addOperation(key, new IncrementOperation(amount));
    return this;
  }

  decrement(key: string, amount = 1): this {
    return this.increment(key, -amount);
  }

  unset(key: string): this {
    this._addOperation(key, new DeleteOperation());
    return this;
  }

  add(key: string, item: unknown): this;
  add(key: string, items: unknown[]): this;
  add(key: string, param: unknown | unknown[]): this {
    if (Array.isArray(param)) {
      this._addOperation(key, new AddOperation(param));
    } else {
      this._addOperation(key, new AddOperation([param]));
    }
    return this;
  }

  addUnique(key: string, item: unknown): this;
  addUnique(key: string, items: unknown[]): this;
  addUnique(key: string, param: unknown | unknown[]): this {
    if (Array.isArray(param)) {
      this._addOperation(key, new AddUniqueOperation(param));
    } else {
      this._addOperation(key, new AddUniqueOperation([param]));
    }
    return this;
  }

  marshal(onlyUnsavedAttrs = false): Record<string, unknown> {
    const data = onlyUnsavedAttrs ? {} : { ...this._savedAttrs };
    Object.assign(data, this._unsavedAttrs);
    Object.entries(this._operations).forEach(([key, op]) => {
      data[key] = op.toJSON();
    });
    RESERVED_KEYS.forEach((key) => delete data[key]);
    return data;
  }

  toJSON(): Record<string, unknown> {
    return this.marshal();
  }

  revert(keys?: string[]): this {
    if (keys) {
      keys.forEach((key) => {
        delete this._unsavedAttrs[key];
        delete this._operations[key];
      });
    } else {
      this._unsavedAttrs = {};
      this._operations = {};
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
        this.id,
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
