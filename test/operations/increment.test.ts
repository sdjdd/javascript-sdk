import 'should';

import { IncrementOperation, NAME_INCREMENT } from '../../src/core/operations';

describe('IncrementOperation', function () {
  describe('#constructor', function () {
    it('should set correct name and amount', function () {
      const amount = 12345;
      const op = new IncrementOperation(amount);
      op.name.should.eql(NAME_INCREMENT);
      op.extra.amount.should.eql(amount);
    });
  });
});
