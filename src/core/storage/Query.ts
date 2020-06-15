import { Storage } from './Storage';

export type Condition = '==' | '>=' | '<=' | '!=';

export class Query {
  private _and: Record<string, unknown>[] = [];
  private _or: string[] = [];

  constructor(public className: string, public _storage: Storage) {}

  async get(): Promise<unknown[]> {
    if (this._or.length > 0 && this._and.length > 0) {
      this.or();
    }
    let whereStr: string;
    if (this._or.length > 0) {
      whereStr = this._encodeOr();
    } else {
      whereStr = this._encodeAnd();
    }
    if (whereStr === '{}') {
      whereStr = '';
    } else {
      whereStr = '?where=' + encodeURIComponent(whereStr);
    }

    const client = this._storage.app.client;
    const path = `/1.1/classes/${this.className + whereStr}`;
    const { body } = await client.get(path);
    return body.results as unknown[];
  }

  private _encodeAnd(): string {
    if (this._and.length === 0) {
      return '{}';
    } else if (this._and.length === 1) {
      return JSON.stringify(this._and[0]);
    } else {
      return JSON.stringify({ $and: this._and });
    }
  }

  private _encodeOr(): string {
    if (this._or.length === 0) {
      return '{}';
    }
    let or = this._or;
    if (this._and.length > 0) {
      or = or.slice();
      or.push(this._encodeAnd());
    }
    if (or.length === 1) {
      return '{"$or":' + or[0] + '}';
    } else {
      return '{"$or":[' + or.join(',') + ']}';
    }
  }

  where(key: string, cond: Condition, value: unknown): Query {
    const query = this.clone();
    switch (cond) {
      case '==':
        // do nothing
        break;
    }
    if (query._and.length === 0 || query._and[0][key] !== undefined) {
      query._and.unshift({ [key]: value });
    } else {
      query._and[0][key] = value;
    }
    return query;
  }

  or(): Query {
    const andStr = this._encodeAnd();
    if (andStr === '{}') {
      return;
    }
    const query = this.clone();
    query._or.push(andStr);
    query._and = [];
    return query;
  }

  clone(): Query {
    const query = new Query(this.className, this._storage);
    query._and = [...this._and];
    query._or = [...this._or];
    return query;
  }
}
