import { App } from '../app';
import { ObjectAttributes, ObjectReference } from './Object';
import { PlatformSupport } from '../Platform';
import { isRegExp } from '../utils';
import { HTTPRequest } from '../http';

export type Condition =
  | '=='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'exists'
  | 'not-exists'
  | 'has'
  | 'has-any'
  | 'length-is'
  | 'in'
  | 'matchs';

interface OrderByAttribute {
  key: string;
  desc: boolean;
}

export class Query {
  private _and: unknown[] = [];
  private _or: unknown[] = [];
  private _limit: number;
  private _skip: number;
  private _orderBy: OrderByAttribute[] = [];
  private _select: string[] = [];

  static and(...queries: Query[]): Query {
    if (queries.length < 2) {
      throw new Error('The and method receive at least 2 queries');
    }

    const className = queries[0].className;
    const app = queries[0].app;
    for (let i = 1; i < queries.length; i++) {
      if (queries[i].className != className) {
        throw new Error('All queries must belongs to same Class');
      }
      if (queries[i].app.info.appId != app.info.appId) {
        throw new Error('All queries must belongs to same App');
      }
    }

    const query = new Query(className, app);
    queries.forEach((q) => query._and.push(q._parseWhere()));
    return query;
  }

  static or(...queries: Query[]): Query {
    const query = Query.and(...queries);
    query._or = query._and;
    query._and = [];
    return query;
  }

  constructor(public className: string, public app: App) {}

  clone(): Query {
    const query = new Query(this.className, this.app);
    query._and = [...this._and];
    query._or = [...this._or];
    query._limit = this._limit;
    query._skip = this._skip;
    query._orderBy = [...this._orderBy];
    query._select = [...this._select];
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

  select(...column: string[]): Query {
    const query = this.clone();
    query._select = column;
    return query;
  }

  // TODO: refactor
  where(key: string, cond: Condition, value?: unknown): Query {
    let where: unknown;
    switch (cond) {
      case '==':
        where = value;
        break;

      case '!=':
        where = { $ne: value };
        break;

      case '>':
        where = { $gt: value };
        break;

      case '>=':
        where = { $gte: value };
        break;

      case '<':
        where = { $lt: value };
        break;

      case '<=':
        where = { $lte: value };
        break;

      case 'exists':
        where = { $exists: true };
        break;

      case 'not-exists':
        where = { $exists: false };
        break;

      case 'has':
        if (Array.isArray(value)) {
          where = { $all: value };
        } else {
          where = value;
        }
        break;

      case 'has-any':
        if (Array.isArray(value)) {
          where = { $in: value };
        } else {
          where = value;
        }
        break;

      case 'length-is':
        if (typeof value !== 'number') {
          throw new TypeError(
            'condition "lengthIs" receives a number parameter'
          );
        }
        where = { $size: value };
        break;

      case 'in': {
        if (!(value instanceof Query)) {
          throw new Error('TODO');
        }
        if (value._select.length > 0) {
          if (value._select.length !== 1) {
            throw new Error('TODO');
          }
          where = {
            $select: {
              key: value._select[0],
              query: {
                className: value.className,
                where: value._parseWhere(),
              },
            },
          };
        } else {
          where = {
            $inQuery: {
              className: value.className,
              where: value._parseWhere(),
            },
          };
        }
        break;
      }

      case 'matchs':
        if (typeof value === 'string') {
          where = { $regex: value };
        } else if (isRegExp(value)) {
          const re = value as RegExp;
          let $options = '';
          if (re.ignoreCase) {
            $options += 'i';
          }
          if (re.multiline) {
            $options += 'm';
          }
          where = { $regex: re.source, $options };
        } else {
          throw new Error('"match" condition only accept string or RegExp');
        }
        break;

      default:
        throw new TypeError(`string key not support "${cond}" condition`);
    }

    const query = this.clone();
    query._pushAnd(key, where);
    return query;
  }

  or(): Query {
    const query = this.clone();
    if (query._and.length > 0) {
      if (query._and.length === 1) {
        query._or.push(query._and[0]);
      } else {
        query._or.push(query._and);
      }
    }
    query._and = [];
    return query;
  }

  limit(count: number): Query {
    const query = this.clone();
    query._limit = count;
    return query;
  }

  skip(count: number): Query {
    const query = this.clone();
    query._skip = count;
    return query;
  }

  orderBy(key: string, rule: 'asc' | 'desc' = 'asc'): Query {
    const query = this.clone();
    query._orderBy.push({ key, desc: rule === 'desc' });
    return query;
  }

  async count(): Promise<number> {
    const req = this._makeRequest();
    req.query.count = '1';
    req.query.limit = '0';

    const platform = PlatformSupport.getPlatform();
    const res = await platform.network.request(req);

    return (res.body as { count: number }).count;
  }

  // TODO: rafactor
  _parseWhere(): unknown {
    if (this._or.length > 0) {
      const or = [...this._or];
      if (this._and.length > 0) {
        if (this._and.length === 1) {
          or.push(this._and[0]);
        } else {
          or.push(this._and);
        }
      }
      return { $or: or };
    } else {
      if (this._and.length === 0) {
        return {};
      } else if (this._and.length === 1) {
        return this._and[0];
      } else {
        return { $and: this._and };
      }
    }
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

  _makeRequest(): HTTPRequest {
    const req = this.app._makeBaseRequest(
      'GET',
      `/1.1/classes/${this.className}`
    );
    const where = JSON.stringify(this._parseWhere());
    if (where != '{}') {
      req.query = { where };
    }

    if (this._limit !== undefined) {
      req.query.limit = this._limit.toString();
    }
    if (this._skip !== undefined) {
      req.query.skip = this._skip.toString();
    }
    if (this._orderBy.length > 0) {
      req.query.order = this._orderBy
        .map((o) => (o.desc ? '-' : '') + o.key)
        .join(',');
    }
    if (this._select.length > 0) {
      req.query.keys = this._select.join(',');
    }
    return req;
  }

  async find(): Promise<ObjectReference[]> {
    const req = this._makeRequest();

    const platform = PlatformSupport.getPlatform();
    const res = await platform.network.request(req);

    const results = (res.body as {
      results: ObjectAttributes[];
    }).results;

    if (!results) {
      return [];
    }

    return results.map((result) => {
      ObjectReference.decodeAdvancedType(this.app, result);
      const objRef = new ObjectReference(
        this.app,
        this.className,
        result.objectId
      );
      objRef.data = result;
      return objRef;
    });
  }
}
