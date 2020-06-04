import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/av.js',
      format: 'cjs',
    },
    {
      file: 'dist/av.esm.js',
      format: 'es',
    },
  ],
  plugins: [commonjs(), typescript(), resolve()],
};
