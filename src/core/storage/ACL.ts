import { User } from '../user/User';

export type ACLSubject = User | string | '*';
export type ACLAction = 'read' | 'write';

export class ACL {
  private _data: Record<string, { read?: boolean; write?: boolean }> = {};

  allow(subject: ACLSubject, action: 'read' | 'write'): this {
    let key: string;
    if (subject instanceof User) {
      key = subject.objectId;
    } else {
      key = subject;
    }

    if (this._data[key] === undefined) {
      this._data[key] = {};
    }
    if (action === 'read') {
      this._data[key].read = true;
    }
    if (action === 'write') {
      this._data[key].write = true;
    }
    return this;
  }

  deny(subject: ACLSubject, action: 'read' | 'write'): this {
    let key: string;
    if (subject instanceof User) {
      key = subject.objectId;
    } else {
      key = subject;
    }

    if (this._data[key] === undefined) {
      this._data[key] = {};
    }
    if (action === 'read') {
      this._data[key].read = false;
    }
    if (action === 'write') {
      this._data[key].write = false;
    }
    return this;
  }

  can(subject: ACLSubject, action: ACLAction): boolean {
    let key: string;
    if (subject instanceof User) {
      key = subject.objectId;
    } else {
      key = subject;
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
