import { ClassReference } from './ClassReference';
import { Value } from './Value';
import { ObjectReference, Pointer, File } from './ObjectReference';
import { API } from '../app/API';

export class Storage {
  static Value = new Value();

  constructor(public api: API) {}

  // async _requestFileToken(file: File): Promise<Record<string, unknown>> {
  //   const path = `/1.1/fileTokens`;
  //   const res = await this.app.client.post(path, {
  //     key: file.key,
  //     name: file.name,
  //     keep_file_name: undefined,
  //     ACL: undefined,
  //     mime_type: undefined,
  //     metaData: undefined, // metaData is not necessary
  //   });
  //   return res as Record<string, unknown>;
  // }

  Class(name: string): ClassReference {
    return new ClassReference(name, this.api);
  }
}
