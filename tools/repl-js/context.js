const env = require('../../env.json');
const LC = require('../../dist/core/av');

module.exports = {
  app: new LC.App(env),
};
