import { App } from '../app/app';
import { ClassReference } from './ClassReference';
import { Value } from './Value';
import { ObjectReference, Pointer, File } from './ObjectReference';

export class Storage {
  static Value = new Value();
  app: App;

  constructor(app?: App) {
    this.app = app;
  }

  async _createObject(
    className: string,
    data: Record<string, unknown>
  ): Promise<string> {
    const path = `/1.1/classes/${className}`;
    const { body } = await this.app.client.post(path, data);
    return body.objectId as string;
  }

  async _updateObject(
    className: string,
    objectId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const path = `/1.1/classes/${className}/${objectId}`;
    await this.app.client.put(path, data);
  }

  async _deleteObject(className: string, objectId: string): Promise<void> {
    const path = `/1.1/classes/${className}/${objectId}`;
    await this.app.client.delete(path);
  }

  async _getObject(
    className: string,
    objectId: string
  ): Promise<Record<string, unknown>> {
    const path = `/1.1/classes/${className}/${objectId}`;
    const { body } = await this.app.client.get(path);
    return body;
  }

  async _requestFileToken(file: File): Promise<Record<string, unknown>> {
    const path = `/1.1/fileTokens`;
    const { body } = await this.app.client.post(path, {
      key: file.key,
      name: file.name,
      keep_file_name: undefined,
      ACL: undefined,
      mime_type: undefined,
      metaData: undefined, // metaData is not necessary
    });
    return body;
  }

  _parsePointer(ptr: Pointer): ObjectReference {
    return this.Class(ptr.className).object(ptr.objectId);
  }

  Class(name: string): ClassReference {
    return new ClassReference(name, this);
  }
}
