#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Critical implementation files that must never be lost
const criticalFiles = [
  // Task 2.2 - Session Management
  'apps/tracking/src/core/SessionManager.ts',
  'apps/tracking/src/__tests__/SessionManager.test.ts',
  'apps/tracking/jest.config.cjs',

  // Task 2.3 - IP-to-Company Mapping
  'apps/api/src/services/ip-to-company-service.ts',
  'apps/api/src/routes/ip-company.ts',
  'apps/api/src/__tests__/ip-to-company.test.ts',

  // Task 2.4 - Behavioral Tracking
  'apps/tracking/src/modules/BehavioralTracker.ts',
  'apps/tracking/src/__tests__/BehavioralTracker.test.ts',

  // Core infrastructure files
  'apps/tracking/src/core/Tracker.ts',
  'apps/tracking/src/core/Storage.ts',
  'apps/tracking/src/core/EventEmitter.ts',
  'apps/tracking/src/types/index.ts',
  'apps/tracking/src/index.ts'
];

// Optional files that are important but not critical
const importantFiles = [
  'apps/api/src/services/database.ts',
  'apps/api/src/services/event-manager.ts',
  'apps/api/src/services/cache-service.ts',
  'apps/web/components/Dashboard.tsx'
];

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(path.join(process.cwd(), filePath));
    return (stats.size / 1024).toFixed(1) + 'KB';
  } catch (error) {
    return 'Unknown';
  }
}

console.log('🔍 Verifying Critical Implementation Files...\n');

let missingCritical = [];
let missingImportant = [];
let totalSize = 0;

// Check critical files
console.log('📋 CRITICAL FILES (Tasks 2.2-2.4):');
criticalFiles.forEach(file => {
  if (checkFileExists(file)) {
    const size = getFileSize(file);
    console.log(`✅ ${file} (${size})`);
    totalSize += fs.statSync(path.join(process.cwd(), file)).size;
  } else {
    console.log(`❌ ${file} - MISSING!`);
    missingCritical.push(file);
  }
});

console.log('\n📋 IMPORTANT FILES:');
importantFiles.forEach(file => {
  if (checkFileExists(file)) {
    const size = getFileSize(file);
    console.log(`✅ ${file} (${size})`);
  } else {
    console.log(`⚠️  ${file} - Missing (non-critical)`);
    missingImportant.push(file);
  }
});

console.log(`\n📊 SUMMARY:`);
console.log(`- Critical files: ${criticalFiles.length - missingCritical.length}/${criticalFiles.length} present`);
console.log(`- Important files: ${importantFiles.length - missingImportant.length}/${importantFiles.length} present`);
console.log(`- Total implementation size: ${(totalSize / 1024).toFixed(1)}KB`);

if (missingCritical.length > 0) {
  console.log('\n🚨 CRITICAL FILES MISSING!');
  console.log('🛑 BLOCKING COMMIT - These files are required:');
  missingCritical.forEach(file => console.log(`   - ${file}`));
  console.log('\n🔧 Recovery suggestions:');
  console.log('   1. Check git stash: git stash list');
  console.log('   2. Check recent commits: git reflog --oneline -10');
  console.log('   3. Run emergency recovery: node scripts/emergency-recovery.js');
  console.log('   4. Restore from backup tags: git tag -l "backup-*"');
  process.exit(1);
}

if (missingImportant.length > 0) {
  console.log('\n⚠️  Important files missing (non-blocking):');
  missingImportant.forEach(file => console.log(`   - ${file}`));
}

console.log('\n✅ All critical files verified - safe to proceed!');
process.exit(0);
