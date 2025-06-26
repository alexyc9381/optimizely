#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚨 EMERGENCY RECOVERY MODE');
console.log('=====================================\n');

function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

function checkCriticalFiles() {
  console.log('🔍 Checking for critical implementation files...\n');

  const criticalFiles = [
    'apps/tracking/src/core/SessionManager.ts',
    'apps/tracking/src/modules/BehavioralTracker.ts',
    'apps/api/src/services/ip-to-company-service.ts',
    'apps/api/src/routes/ip-company.ts'
  ];

  let missingFiles = [];

  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} - Present`);
    } else {
      console.log(`❌ ${file} - MISSING!`);
      missingFiles.push(file);
    }
  });

  return missingFiles;
}

function checkStash() {
  console.log('\n📦 Checking git stash...');

  const stashList = runCommand('git stash list');
  if (stashList.includes('Error') || !stashList) {
    console.log('No stashes found.');
    return false;
  }

  console.log(stashList);

  const stashContents = runCommand('git stash show stash@{0} --name-only');
  console.log('\n📋 Stash@{0} contents:');
  console.log(stashContents);

  const hasFiles = stashContents.includes('SessionManager') ||
                  stashContents.includes('BehavioralTracker') ||
                  stashContents.includes('ip-to-company');

  if (hasFiles) {
    console.log('✅ Critical files found in stash!');
    return true;
  }

  return false;
}

function checkReflog() {
  console.log('\n📜 Checking git reflog for recent commits...');

  const reflog = runCommand('git reflog --oneline -10');
  console.log(reflog);

  if (reflog.includes('feat: Complete Universal B2B') ||
      reflog.includes('SessionManager') ||
      reflog.includes('BehavioralTracker')) {
    console.log('✅ Relevant commits found in reflog!');
    return true;
  }

  return false;
}

function checkBackupTags() {
  console.log('\n🏷️  Checking backup tags...');

  const tags = runCommand('git tag -l "backup-*"');
  if (tags.includes('Error') || !tags) {
    console.log('No backup tags found.');
    return false;
  }

  const recentTags = tags.split('\n').slice(-5);
  console.log('Recent backup tags:');
  recentTags.forEach(tag => console.log(`  - ${tag}`));

  return recentTags.length > 0;
}

function showRecoveryOptions(hasStash, hasReflog, hasBackups) {
  console.log('\n🔧 RECOVERY OPTIONS:');
  console.log('=====================================');

  if (hasStash) {
    console.log('\n🎯 OPTION 1: Restore from stash (RECOMMENDED)');
    console.log('git stash apply stash@{0}');
    console.log('# Then verify: node scripts/verify-critical-files.js');
  }

  if (hasReflog) {
    console.log('\n🎯 OPTION 2: Restore from recent commit');
    console.log('# Find the commit hash from reflog above, then:');
    console.log('git checkout <commit-hash> -- apps/tracking/src/core/SessionManager.ts');
    console.log('git checkout <commit-hash> -- apps/tracking/src/modules/BehavioralTracker.ts');
    console.log('git checkout <commit-hash> -- apps/api/src/services/ip-to-company-service.ts');
    console.log('git checkout <commit-hash> -- apps/api/src/routes/ip-company.ts');
  }

  if (hasBackups) {
    console.log('\n🎯 OPTION 3: Restore from backup tag');
    console.log('# Choose a recent backup tag from above, then:');
    console.log('git checkout backup-<timestamp>');
    console.log('# Copy files to main branch, then:');
    console.log('git checkout main');
  }

  console.log('\n⚠️  SAFETY PROTOCOL:');
  console.log('1. Create recovery branch first: git checkout -b recovery-$(date +%Y%m%d-%H%M%S)');
  console.log('2. Apply recovery method');
  console.log('3. Verify files: node scripts/verify-critical-files.js');
  console.log('4. Test builds: npm run build --workspaces');
  console.log('5. Only merge to main if everything works');
}

// Main recovery process
const missingFiles = checkCriticalFiles();

if (missingFiles.length === 0) {
  console.log('\n✅ All critical files are present. No recovery needed!');
  process.exit(0);
}

console.log(`\n🚨 Found ${missingFiles.length} missing critical files.`);
console.log('Starting recovery analysis...\n');

const hasStash = checkStash();
const hasReflog = checkReflog();
const hasBackups = checkBackupTags();

if (!hasStash && !hasReflog && !hasBackups) {
  console.log('\n❌ No recovery options found!');
  console.log('Critical files may be permanently lost.');
  console.log('Consider restoring from external backup or reimplementing.');
  process.exit(1);
}

showRecoveryOptions(hasStash, hasReflog, hasBackups);

console.log('\n📞 If you need help, check:');
console.log('- DEVELOPMENT_WORKFLOW_SAFEGUARDS.md');
console.log('- Recent conversation history');
console.log('- Contact development team');

process.exit(0);
