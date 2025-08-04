// Debug script to verify Next.js version during Vercel build
const pkg = require('./package.json');
const nextPkg = require('./node_modules/next/package.json');

console.log('=== VERCEL DEBUG INFO ===');
console.log('Project Next.js version (package.json):', pkg.dependencies.next);
console.log('Installed Next.js version:', nextPkg.version);
console.log('Node.js version:', process.version);
console.log('Working directory:', process.cwd());
console.log('========================');