/* eslint-env node */
/* eslint-disable no-undef */
/** @type {import('@onlook/app').OnlookConfig} */
module.exports = {
  url: 'http://localhost:3002',
  build: {
    outDir: '.next'
  },
  framework: 'nextjs',
  css: {
    framework: 'tailwind',
    configPath: './tailwind.config.js'
  },
  components: {
    include: [
      'components/**/*.tsx',
      'pages/**/*.tsx',
      'src/**/*.tsx'
    ],
    exclude: [
      'node_modules/**',
      '.next/**',
      'coverage/**'
    ]
  },
  git: {
    autoCommit: false,
    commitMessage: 'feat: Update component styling via Onlook'
  },
  server: {
    port: 3002
  },
  inspector: {
    enabled: true,
    position: 'right'
  }
};
