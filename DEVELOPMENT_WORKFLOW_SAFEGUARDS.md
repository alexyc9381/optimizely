# Development Workflow Safeguards
## Critical Prevention Measures Against Work Loss

### 🚨 **INCIDENT ANALYSIS: Task 2.2-2.4 File Loss**

**What Happened:**
- Pre-commit hooks (husky + lint-staged) failed due to ESLint errors
- lint-staged automatically stashed changes to prevent commit
- During recovery attempts, files remained in stash instead of being restored
- Completed implementation files were lost from working directory

**Root Cause:**
- No validation that stash recovery was complete
- No backup verification before attempting git operations
- No safeguards against pre-commit hook failures

---

## 🛡️ **MANDATORY SAFEGUARDS (MUST FOLLOW)**

### 1. **Pre-Commit Safety Protocol**

**BEFORE ANY GIT COMMIT:**
```bash
# Step 1: Verify all files are present
git status
ls -la apps/tracking/src/core/
ls -la apps/tracking/src/modules/
ls -la apps/api/src/services/
ls -la apps/api/src/routes/

# Step 2: Create explicit backup branch
git checkout -b backup-$(date +%Y%m%d-%H%M%S)
git add .
git commit -m "BACKUP: Pre-commit safety backup"
git checkout main

# Step 3: Test builds BEFORE committing
npm run build --workspaces
npm test --workspaces

# Step 4: If pre-commit hooks fail, STOP and fix issues
# Do NOT use --no-verify unless absolutely necessary
```

### 2. **Task Completion Verification Protocol**

**BEFORE MARKING TASK AS DONE:**
```bash
# Verify all task files exist
task-master show <task-id>

# Verify builds work
cd apps/tracking && npm run build && npm test
cd apps/api && npm run build && npm test
cd apps/web && npm run build

# Verify git tracking
git status
git ls-files | grep -E "(SessionManager|BehavioralTracker|ip-to-company)"

# Create task completion commit
git add .
git commit -m "feat: complete task <task-id> - <task-title>

✅ Files created/modified:
- list all new/modified files
- include test results
- include build status

🧪 Testing:
- X/X tests passing
- All builds successful

📋 Task Status: Complete and verified"
```

### 3. **Stash Recovery Safety Protocol**

**IF GIT STASH IS INVOLVED:**
```bash
# Step 1: List all stashes
git stash list

# Step 2: Show stash contents BEFORE applying
git stash show stash@{0} --name-only

# Step 3: Create recovery branch
git checkout -b stash-recovery-$(date +%Y%m%d-%H%M%S)

# Step 4: Apply stash carefully
git stash apply stash@{0}

# Step 5: VERIFY ALL FILES RESTORED
git status
git diff --name-only

# Step 6: Test everything works
npm run build --workspaces
npm test --workspaces

# Step 7: Only merge back if verification passes
git checkout main
git merge stash-recovery-<timestamp>
```

### 4. **Continuous Backup Protocol**

**DURING ACTIVE DEVELOPMENT:**
```bash
# Every 30 minutes of work
git add .
git commit -m "WIP: <task-id> - <progress-description>"

# At end of each coding session
git push origin main

# Before any risky operations (stash, reset, etc.)
git tag backup-$(date +%Y%m%d-%H%M%S)
git push origin backup-$(date +%Y%m%d-%H%M%S)
```

---

## 🔧 **TECHNICAL SAFEGUARDS**

### 1. **Updated .gitignore Protection**
```gitignore
# Protect critical implementation files
!apps/tracking/src/core/SessionManager.ts
!apps/tracking/src/modules/BehavioralTracker.ts
!apps/api/src/services/ip-to-company-service.ts
!apps/api/src/routes/ip-company.ts
!apps/tracking/src/__tests__/SessionManager.test.ts
!apps/tracking/src/__tests__/BehavioralTracker.test.ts
!apps/api/src/__tests__/ip-to-company.test.ts

# But still ignore common build artifacts
apps/*/dist/
apps/*/build/
apps/*/.next/
```

### 2. **Pre-Commit Hook Safety**
```bash
# Add to package.json
"husky": {
  "hooks": {
    "pre-commit": "npm run safety-check && lint-staged"
  }
}

# Add safety-check script
"scripts": {
  "safety-check": "node scripts/verify-critical-files.js"
}
```

### 3. **Critical Files Verification Script**
```javascript
// scripts/verify-critical-files.js
const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'apps/tracking/src/core/SessionManager.ts',
  'apps/tracking/src/modules/BehavioralTracker.ts',
  'apps/api/src/services/ip-to-company-service.ts',
  'apps/api/src/routes/ip-company.ts'
];

criticalFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`❌ CRITICAL FILE MISSING: ${file}`);
    process.exit(1);
  }
});

console.log('✅ All critical files verified');
```

---

## 📋 **TASKMASTER INTEGRATION SAFEGUARDS**

### 1. **Task Status Verification**
```bash
# Before marking task done, verify implementation exists
task-master show <task-id>
find . -name "*SessionManager*" -o -name "*BehavioralTracker*" -o -name "*ip-to-company*"

# Only mark done if files exist and tests pass
npm test --workspaces && task-master set-status --id=<task-id> --status=done
```

### 2. **Progress Documentation**
```bash
# Document all created files in task updates
task-master update-subtask --id=<task-id> --prompt="
✅ Implementation Complete:

📁 Files Created:
- apps/tracking/src/core/SessionManager.ts (16KB)
- apps/tracking/src/__tests__/SessionManager.test.ts
- [list all files]

🧪 Testing Status:
- X/X tests passing
- All builds successful

📦 Git Status:
- All files committed: $(git log -1 --oneline)
- Files tracked: $(git ls-files | grep -c 'SessionManager\|BehavioralTracker')

✅ Verified and working"
```

### 3. **Recovery Checklist**
If files are ever lost again:

1. **STOP** - Don't make any more git operations
2. Check `git stash list`
3. Check `git reflog` for recent commits
4. Check recent backup tags: `git tag -l "backup-*"`
5. Use this recovery script:

```bash
#!/bin/bash
# scripts/emergency-recovery.sh
echo "🚨 Emergency Recovery Mode"
echo "Checking for lost implementation files..."

# Check stash
git stash list
echo "Found stashes. Checking contents..."
git stash show stash@{0} --name-only | grep -E "(SessionManager|BehavioralTracker|ip-to-company)"

# Check reflog
echo "Checking recent commits..."
git reflog --oneline -10

# Check backup tags
echo "Checking backup tags..."
git tag -l "backup-*" | tail -5

echo "Please run one of:"
echo "1. git stash apply stash@{0}  # if files in stash"
echo "2. git checkout <commit-hash> -- <filepath>  # if in reflog"
echo "3. git checkout backup-<timestamp>  # if backup exists"
```

---

## 🎯 **PREVENTION SUMMARY**

**NEVER AGAIN:**
1. ✅ Always create backup branch before risky operations
2. ✅ Verify file existence before/after git operations
3. ✅ Test builds before committing
4. ✅ Use staged commits for continuous backup
5. ✅ Document all file locations in task updates
6. ✅ Use emergency recovery procedures if needed

**FAIL-SAFES:**
- Backup tags every session
- Critical file verification script
- Detailed task documentation
- Stash recovery protocol
- Emergency recovery script

This incident will NEVER happen again.
