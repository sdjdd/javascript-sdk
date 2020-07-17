import { v4 as uuid } from 'uuid';
import { decode } from 'base64-arraybuffer';
import { IFile } from '../types';
import { ACL } from './ACL';

export class File implements IFile {
  __type: 'File' = 'File';
  key: string;
  name: string;
  data: ArrayBuffer;
  mime: string;
  objectId: string;
  ACL?: ACL;

  constructor(name: string, data?: unknown) {
    this.key = uuid();
    if (name.includes('.')) {
      const ext = name.split('.').pop();
      this.key += '.' + ext;
    }
    this.name = name;

    if (data instanceof ArrayBuffer) {
      this.data = data;
    }
    if (typeof data === 'string') {
      this.data = decode(data);
    }
  }

  static fromRawString(name: string, data: string): File {
    const file = new File(name);
    const encoder = new TextEncoder();
    file.data = encoder.encode(data).buffer;
    return file;
  }
}
