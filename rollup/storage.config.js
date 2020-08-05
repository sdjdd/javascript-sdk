import typescript from '@rollup/plugin-typescript';
import commomjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/storage.js',
    format: 'cjs',
  },
  plugins: [typescript(), commomjs()],
};
