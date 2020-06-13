import { Operation } from './Operation';

export const NAME_ADD_UNIQUE = 'AddUnique';

export class AddUniqueOperation extends Operation {
  extra: { objects: unknown[] };

  constructor(items: unknown[]) {
    items = Array.from(new Set(items));
    super(NAME_ADD_UNIQUE, { objects: items });
  }
}
