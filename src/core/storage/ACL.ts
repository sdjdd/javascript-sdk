import { ACLAction, ACLSubject } from '../types';

export interface ACLPrivilege {
  read?: boolean;
  write?: boolean;
}

export class ACL {
  private _data: Record<string, ACLPrivilege> = {};

  static from(data: Record<string, ACLPrivilege>): ACL {
    const acl = new ACL();
    Object.entries(data).forEach(([subject, privilege]) => {
      if (privilege.read) {
        acl.allow(subject, 'read');
      } else {
        acl.deny(subject, 'read');
      }
      if (privilege.write) {
        acl.allow(subject, 'write');
      } else {
        acl.deny(subject, 'write');
      }
    });
    return acl;
  }

  private static _subjectToId(subject: ACLSubject): string {
    if (typeof subject === 'string') {
      return subject;
    } else {
      return subject.objectId;
    }
  }

  allow(subject: ACLSubject, action: ACLAction): this {
    const id = ACL._subjectToId(subject);
    if (this._data[id] === undefined) {
      this._data[id] = {};
    }
    this._data[id][action] = true;
    return this;
  }

  deny(subject: ACLSubject, action: ACLAction): this {
    const id = ACL._subjectToId(subject);
    if (this._data[id] === undefined) {
      this._data[id] = {};
    }
    this._data[id][action] = false;
    return this;
  }

  can(subject: ACLSubject, action: ACLAction): boolean {
    const id = ACL._subjectToId(subject);
    return this._data[id] && this._data[id][action];
  }

  toJSON(): unknown {
    return this._data;
  }
}
