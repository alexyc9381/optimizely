/* eslint-disable no-undef */
/**
 * @type {import('@onlook/core').OnlookConfig}
 */
module.exports = {
  // Target your main development server
  devServer: {
    url: 'http://localhost:3001',
    port: 3001
  },

  // Specify components to focus on
  components: {
    include: [
      './components/**/*.tsx',
      './pages/**/*.tsx'
    ],
    exclude: [
      './components/ui/sidebar.tsx', // Avoid complex animation components initially
      './node_modules/**'
    ]
  },

  // Preserve your existing CSS classes
  css: {
    framework: 'tailwind',
    preserveClasses: true,
    customProperties: true
  },

  // Git integration for safe editing
  git: {
    autoCommit: false, // Manual control over commits
    commitMessage: 'feat(ui): Onlook visual design updates'
  },

  // Component inspection settings
  inspector: {
    showClassNames: true,
    showProps: true,
    highlightOnHover: true
  }
}
