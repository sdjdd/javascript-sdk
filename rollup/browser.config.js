import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/entry/browser.ts',
  output: {
    file: 'dist/browser/lc.min.js',
    format: 'umd',
    name: 'LC',
  },
  plugins: [resolve({ browser: true }), commonjs(), typescript(), terser()],
};
