import { App } from '../app';
import { ObjectAttributes } from './Object';
import { HTTPRequest } from '../http';

export type Condition = '==' | '!=' | '>' | '>=' | '<' | '<=';

type AndCondition = Record<string, unknown>;

export class Query {
  private _and: AndCondition[] = [];

  constructor(public className: string, public app: App) {}

  clone(): Query {
    const query = new Query(this.className, this.app);
    query._and = [...this._and];
    return query;
  }

  private _pushAnd(key: string, cond: unknown) {
    if (
      this._and.length === 0 ||
      this._and[this._and.length - 1][key] !== undefined
    ) {
      this._and.push({ [key]: cond });
    } else {
      this._and[this._and.length - 1][key] = cond;
    }
  }

  where(key: string, cond: Condition, value?: unknown): Query {
    let condObj: unknown;
    switch (cond) {
      case '==': {
        condObj = value;
        break;
      }
      case '!=': {
        condObj = { $ne: value };
        break;
      }
      case '>': {
        condObj = { $gt: value };
        break;
      }
      case '>=': {
        condObj = { $gte: value };
        break;
      }
      case '<': {
        condObj = { $lt: value };
        break;
      }
      case '<=': {
        condObj = { $lte: value };
        break;
      }
    }

    const query = this.clone();
    query._pushAnd(key, condObj);
    return query;
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

  async get(): Promise<ObjectAttributes[]> {
    const req = new HTTPRequest({
      method: 'GET',
      path: `/1.1/classes/${this.className}`,
      query: {
        where: this._encodeAnd(),
      },
    });
    const res = (await this.app._doRequest(req)) as {
      results: ObjectAttributes[];
    };
    return res.results;
  }

  // async get(): Promise<LCObject[]> {
  //   let whereStr = '';
  //   if (this._and.length > 0) {
  //     whereStr = '?where=' + encodeURIComponent(this._encodeAnd());
  //   }

  //   const client = this._storage.app.client;
  //   const path = `/1.1/classes/${this.className + whereStr}`;
  //   const res = (await client.get(path)) as Record<string, unknown>;
  //   return res.results as LCObject[];
  // }

  // private _encodeAnd(): string {
  //   if (this._and.length === 0) {
  //     return '{}';
  //   } else if (this._and.length === 1) {
  //     return JSON.stringify(this._and[0]);
  //   } else {
  //     return JSON.stringify({ $and: this._and });
  //   }
  // }
}
