import { ClassReference } from './ClassReference';

export class ObjectReference {
  constructor(private _clazz: ClassReference, public id?: string) {}

  async set(data: Record<string, unknown>): Promise<void> {
    if (this.id !== undefined) {
      await this._clazz.updateObject(this.id, data);
    } else {
      await this._clazz.createObject(data);
    }
  }

  async delete(): Promise<void> {
    if (this.id === undefined) {
      throw new Error('objectId must be provided');
    }
    await this._clazz.deleteObject(this.id);
  }
}
