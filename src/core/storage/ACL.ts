export type ACLSubject = '*' | string;
export type ACLAction = 'read' | 'write';

export interface ACLPrivilege {
  read?: boolean;
  write?: boolean;
}

export class ACL {
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

  private _data: Record<string, ACLPrivilege> = {};

  private static _subjectToId(subject: ACLSubject): string {
    return subject;
    // if (subject instanceof User) {
    //   return subject.objectId;
    // } else {
    //   return subject;
    // }
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
