export type ACLSubject = string | '*';
export type ACLAction = 'read' | 'write';

export class ACL {
  private _data: Record<string, { read?: boolean; write?: boolean }> = {};

  allow(subject: ACLSubject, action: 'read' | 'write'): this {
    const key: string = subject;

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
    const key: string = subject;

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
    const key: string = subject;
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
