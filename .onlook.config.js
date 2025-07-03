/* eslint-env node */
/* eslint-disable no-undef */
/** @type {import('@onlook/app').OnlookConfig} */
module.exports = {
  // Point to the Next.js app in the monorepo
  url: 'http://localhost:3002',

  // Since this is a monorepo, specify the web app location
  root: './apps/web',

  build: {
    outDir: './apps/web/.next'
  },

  framework: 'nextjs',

  css: {
    framework: 'tailwind',
    configPath: './apps/web/tailwind.config.js'
  },

  components: {
    include: [
      'apps/web/components/**/*.tsx',
      'apps/web/pages/**/*.tsx',
      'apps/web/src/**/*.tsx'
    ],
    exclude: [
      'node_modules/**',
      'apps/web/.next/**',
      'apps/web/coverage/**',
      'apps/api/**'
    ]
  },

  // Custom dev command for monorepo
  dev: {
    command: 'cd apps/web && npm run dev',
    port: 3002
  },

  git: {
    autoCommit: false,
    commitMessage: 'feat: Update component styling via Onlook'
  },

  inspector: {
    enabled: true,
    position: 'right'
  }
};
