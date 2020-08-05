import typescript from '@rollup/plugin-typescript';
import commomjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/storage/LiveQuery.ts',
  output: {
    file: 'dist/live-query.js',
    format: 'cjs',
  },
  plugins: [typescript(), commomjs()],
};
