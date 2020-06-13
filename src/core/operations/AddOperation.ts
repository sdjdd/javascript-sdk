import { Operation } from './Operation';

export const NAME_ADD = 'Add';

export class AddOperation extends Operation {
  extra: { objects: unknown[] };

  constructor(items: unknown[]) {
    super(NAME_ADD, { objects: items });
  }
}
