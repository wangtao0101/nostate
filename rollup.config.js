import ts from 'rollup-plugin-typescript2';
import path from 'path';

const resolve = d => path.resolve(__dirname, d);

export default {
  input: resolve('src/index.ts'),

  output: {
    file: resolve('dist/hux.cjs.js'),
    format: 'cjs'
  },

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
    })
  ]
};
