import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/live-query/LiveQuery.ts',
  output: {
    file: 'dist/live-query.js',
    format: 'cjs',
  },
  external: ['leancloud-realtime/core', 'leancloud-realtime-plugin-live-query'],
  plugins: [typescript()],
};
