import { App } from '../app';

export type Condition = '==' | '>=' | '<=' | '!=';

type AndCondition = Record<string, unknown>;

export class Query {
  private _and: AndCondition[] = [];

  constructor(public className: string, public app: App) {}

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

  // where(key: string, cond: Condition, value?: unknown): Query {
  //   const query = this.clone();
  //   switch (cond) {
  //     case '==':
  //       if (value === undefined) {
  //         value = { $exists: false };
  //       }
  //       break;
  //     case '!=':
  //       if (value === undefined) {
  //         value = { $exists: true };
  //       } else {
  //         value = { $ne: value };
  //       }
  //       break;
  //   }
  //   if (query._and.length === 0 || query._and[0][key] !== undefined) {
  //     query._and.unshift({ [key]: value });
  //   } else {
  //     query._and[0][key] = value;
  //   }
  //   return query;
  // }

  // clone(): Query {
  //   const query = new Query(this.className, this._storage);
  //   query._and = [...this._and];
  //   return query;
  // }
}
