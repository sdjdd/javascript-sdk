import { ClassReference } from './ClassReference';

async function createObject(
  classRef: ClassReference,
  data: Record<string, unknown>
): Promise<string> {
  const client = classRef._storage.app.client;
  const path = `/1.1/classes/${classRef.name}`;
  const { body } = await client.post(path, data);
  return body.objectId as string;
}

async function updateObject(
  classRef: ClassReference,
  id: string,
  data: Record<string, unknown>
) {
  const client = classRef._storage.app.client;
  const path = `/1.1/classes/${classRef.name}/${id}`;
  await client.put(path, data);
}

async function deleteObject(classRef: ClassReference, id: string) {
  const client = classRef._storage.app.client;
  const path = `/1.1/classes/${classRef.name}/${id}`;
  await client.delete(path);
}

async function getObject(classRef: ClassReference, id: string) {
  const client = classRef._storage.app.client;
  const path = `/1.1/classes/${classRef.name}/${id}`;
  const { body } = await client.get(path);
  return body;
}

export class ObjectReference {
  constructor(private _clazz: ClassReference, public id?: string) {}

  get className(): string {
    return this._clazz.name;
  }

  async set(data: Record<string, unknown>): Promise<void> {
    if (this.id === undefined) {
      this.id = await createObject(this._clazz, data);
    } else {
      await updateObject(this._clazz, this.id, data);
    }
  }

  async delete(): Promise<void> {
    if (this.id === undefined) {
      throw new Error('objectId must be provided');
    }
    await deleteObject(this._clazz, this.id);
  }

  get(): Promise<unknown> {
    return getObject(this._clazz, this.id);
  }
}
