import ts from 'rollup-plugin-typescript2';
import replace from '@rollup/plugin-replace';
import path from 'path';

const resolve = d => path.resolve(__dirname, d);

export default [
  createConfig({
    file: resolve('dist/hookux.cjs.js'),
    format: 'cjs'
  }),
  createConfig({
    file: resolve('dist/hookux.es.js'),
    format: 'es'
  })
];

function createConfig(output) {
  return {
    input: resolve('src/index.ts'),
    output,
    plugins: [
      ts({
        tsconfig: resolve('tsconfig.json'),
        tsconfigOverride: {
          compilerOptions: {
            declaration: true,
            declarationMap: true
          },
          exclude: ['**/__tests__']
        }
      }),
      replace({
        __DEV__: false
      })
    ]
  };
}
