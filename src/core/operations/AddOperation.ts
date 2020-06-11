import { Operation } from '.';
import { AddUniqueOperation } from './AddUniqueOperation';

export const NAME_ADD = 'Add';

export class AddOperation extends Operation {
  extra: { objects: unknown[] };

  constructor(items: unknown[]) {
    super(NAME_ADD, { objects: items });
  }

  merge(base: Operation): this {
    if (base instanceof AddOperation || base instanceof AddUniqueOperation) {
      base.extra.objects.forEach((item) => this.extra.objects.push(item));
    }
    return this;
  }

  apply(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.concat(this.extra.objects);
    }
    return this.extra.objects;
  }
}
