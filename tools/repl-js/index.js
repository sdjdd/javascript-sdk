const Repl = require('repl');
const path = require('path');
const LC = require('../../dist/core/av');
const { node } = require('../../dist/Node');

printUsage();

const repl = Repl.start('leancloud > ');
const historyPath = path.resolve(__dirname, '.history');
repl.setupHistory(historyPath, function (err) {
  if (err) {
    console.error(err);
    process.exit(-1);
  }
});

LC.setPlatform(node);
repl.context.LC = LC;

const context = require('./context');
Object.assign(repl.context, context);

function printUsage() {
  console.log(`Welcome to the LeanCloud JavaScript SDK REPL!

Available Commands:

  .exit - exits the REPL

Available Classes:

  LC.App
  LC.Value

Available Objects:

  env - current environment
  app - instance of AV.App with env
  db  - instance of AV.Storage from app.storage()

`);
}
