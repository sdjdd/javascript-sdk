import { Operation } from '.';

export const NAME_DELETE = 'Delete';

export class DeleteOperation extends Operation {
  constructor() {
    super(NAME_DELETE);
  }

  merge(): this {
    return this;
  }

  apply(): undefined {
    return void 0;
  }
}
