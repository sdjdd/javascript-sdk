import { encodeObjectData } from '../src/core/storage/encoding';

describe('encodeObjectData', function () {
  it('should', function () {
    const encoded = encodeObjectData([1, 2, 3]);
    console.log(encoded);
  });
});
