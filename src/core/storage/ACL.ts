import { ACLAction, ACLSubject, IACL, IACLPrivilege } from '../types';

export class ACL implements IACL {
  private _data: Record<string, IACLPrivilege> = {};

  static from(data: Record<string, IACLPrivilege>): ACL {
    const acl = new ACL();
    Object.entries(data).forEach(([subject, privilege]) => {
      if (privilege.read === true) {
        acl.allow(subject, 'read');
      } else if (privilege.read === false) {
        acl.deny(subject, 'read');
      }
      if (privilege.write === true) {
        acl.allow(subject, 'write');
      } else if (privilege.write === false) {
        acl.deny(subject, 'write');
      }
    });
    return acl;
  }

  static readOnlyFor(...subjects: ACLSubject[]): ACL {
    const acl = new ACL();
    subjects.forEach((subject) => acl.allow(subject, 'read'));
    return acl;
  }

  static grantAllFor(...subjects: ACLSubject[]): ACL {
    const acl = new ACL();
    subjects.forEach((subject) =>
      acl.allow(subject, 'read').allow(subject, 'write')
    );
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
