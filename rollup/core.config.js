import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/core/index.ts',
  output: [
    {
      file: 'dist/core/av.js',
      format: 'cjs',
    },
    {
      file: 'dist/core/av.esm.js',
      format: 'es',
    },
  ],
  plugins: [commonjs(), typescript(), resolve()],
};