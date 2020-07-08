import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';

export default {
  input: 'src/node/index.ts',
  output: [
    {
      file: 'dist/node/index.js',
      format: 'cjs',
    },
    {
      file: 'dist/node/index.esm.js',
      format: 'es',
    },
  ],
  plugins: [
    json(),
    replace({
      'global.GENTLY': false, // workaround for superagent compile error
    }),
    resolve(),
    commonjs(),
    typescript(),
  ],
};
