import typescript from '@rollup/plugin-typescript';
import commomjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/core/index.ts',
  output: {
    file: 'dist/lc.js',
    format: 'cjs',
  },
  plugins: [typescript(), commomjs()],
};
