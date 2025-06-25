import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import bundleSize from 'rollup-plugin-bundle-size';

const isDev = process.env.NODE_ENV === 'development';

const baseConfig = {
  input: 'src/index.ts',
  external: [],
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    typescript({
      declaration: true,
      declarationDir: 'dist/types',
      rootDir: 'src'
    }),
    bundleSize()
  ]
};

const configs = [
  // UMD build (minified)
  {
    ...baseConfig,
    output: {
      file: 'dist/tracker.min.js',
      format: 'umd',
      name: 'OptimizelyTracker',
      sourcemap: !isDev
    },
    plugins: [
      ...baseConfig.plugins,
      !isDev && terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug'],
          passes: 3
        },
        mangle: {
          properties: {
            regex: /^_/
          }
        },
        output: {
          comments: false
        }
      })
    ].filter(Boolean)
  },

  // ES Module build
  {
    ...baseConfig,
    output: {
      file: 'dist/tracker.esm.js',
      format: 'esm',
      sourcemap: !isDev
    },
    plugins: [
      ...baseConfig.plugins,
      !isDev && terser({
        compress: {
          passes: 2
        },
        mangle: false,
        output: {
          comments: false
        }
      })
    ].filter(Boolean)
  }
];

export default configs;
