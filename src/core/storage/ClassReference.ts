import { Storage } from './Storage';
import { ObjectReference } from './ObjectReference';

export class ClassReference {
  constructor(public name: string, private _storage?: Storage) {}

  object(id?: string): ObjectReference {
    return new ObjectReference(this, id);
  }

  async createObject(
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const path = '/1.1/classes/' + this.name + '?fetchWhenSave=true';
    const { body } = await this._storage.app.client.post(path, data);
    return body;
  }

  async updateObject(
    id: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const path =
      '/1.1/classes/' + this.name + '/' + id + '?fetchWhenSave = true';
    const { body } = await this._storage.app.client.put(path, data);
    return body;
  }

  async deleteObject(id: string): Promise<void> {
    const path = '/1.1/classes/' + this.name + '/' + id;
    await this._storage.app.client.delete(path);
  }
}
