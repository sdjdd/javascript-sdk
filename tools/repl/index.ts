import * as Repl from 'repl';
import * as path from 'path';

import * as context from './context';

printUsage();

const repl = Repl.start('leancloud > ');
const historyPath = path.resolve(__dirname, '.history');
repl.setupHistory(historyPath, function (err) {
  if (err) {
    console.error(err);
    process.exit(-1);
  }
});

Object.assign(repl.context, context);

function printUsage() {
  console.log(`Welcome to the LeanCloud JavaScript SDK REPL!

Available Commands:

  .exit - exits the REPL

Available Classes:

  App
  Storage

Available Objects:

  env     - current environment
  storage - instance of Storage with default App

`);
}
