const Repl = require('repl');

import * as context from './context';

printUsage();

const repl = Repl.start('leancloud > ');

Object.assign(repl.context, context);

function printUsage() {
  console.log(`Welcome to the LeanCloud JavaScript SDK REPL!

Available Commands:

.exit - exits the REPL
`);
}
