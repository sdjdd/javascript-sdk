import { User } from '../user/UserObject';

export type ACLSubject = User | '*';
export type ACLAction = 'read' | 'write';

export class ACL {
  private _data: Record<string, { read?: boolean; write?: boolean }> = {};

  allow(subject: ACLSubject, action: 'read' | 'write'): this {
    let key: string;
    if (typeof subject === 'string') {
      key = subject;
    } else {
      key = subject.objectId;
    }

    let obj: { read?: boolean; write?: boolean };
    obj = this._data[key];
    if (obj === undefined) {
      obj = {};
      this._data[key] = obj;
    }

    if (action === 'read') {
      obj.read = true;
    }
    if (action === 'write') {
      obj.write = true;
    }
    return this;
  }

  can(subject: ACLSubject, action: ACLAction): boolean {
    let key: string;
    if (typeof subject === 'string') {
      key = subject;
    } else {
      key = subject.objectId;
    }

    const actions = this._data[key];
    if (actions === undefined) {
      return false;
    }

    return actions[action] !== undefined && actions[action];
  }

  toJSON(): unknown {
    return this._data;
  }
}
