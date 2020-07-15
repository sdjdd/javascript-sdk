import { ACLAction, ACLSubject, IACL, IACLPrivilege } from '../types';

export class ACL implements IACL {
  private _data: Record<string, IACLPrivilege> = {};

  static from(data: Record<string, IACLPrivilege>): ACL {
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

  toJSON(): Record<string, IACLPrivilege> {
    return this._data;
  }
}
