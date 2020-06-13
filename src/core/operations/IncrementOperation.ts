import { Operation } from './Operation';

export const NAME_INCREMENT = 'Increment';

export class IncrementOperation extends Operation {
  extra: { amount: number };

  constructor(amount: number) {
    super(NAME_INCREMENT, { amount });
  }
}
