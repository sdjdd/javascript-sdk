import { Operation } from '.';
import { AddOperation } from './AddOperation';

export const NAME_ADD_UNIQUE = 'AddUnique';

export class AddUniqueOperation extends Operation {
  extra: { objects: unknown[] };

  constructor(items: unknown[]) {
    items = Array.from(new Set(items));
    super(NAME_ADD_UNIQUE, { objects: items });
  }

  merge(base: Operation): this {
    if (base instanceof AddOperation || base instanceof AddUniqueOperation) {
      this.extra.objects = Array.from(
        new Set(this.extra.objects.concat(base.extra.objects))
      );
    }
    return this;
  }

  apply(value: unknown): unknown[] {
    if (Array.isArray(value)) {
      return Array.from(new Set(value.concat(this.extra.objects)));
    }
    return this.extra.objects;
  }
}
