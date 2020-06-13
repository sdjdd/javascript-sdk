import { Operation } from './Operation';

export const NAME_DELETE = 'Delete';

export class DeleteOperation extends Operation {
  constructor() {
    super(NAME_DELETE);
  }
}
