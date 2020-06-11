import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/Node/index.ts',
  output: [
    {
      file: 'dist/Node/av.js',
      format: 'cjs',
    },
    {
      file: 'dist/Node/av.esm.js',
      format: 'es',
    },
  ],
  plugins: [commonjs(), typescript(), resolve()],
};
