#!/usr/bin/env node

/**
 * Automated Context File Updater
 * Keeps .cursor-context.md synchronized with project changes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ContextUpdater {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.contextFile = path.join(this.projectRoot, '.cursor-context.md');
    this.stats = {
      services: 0,
      routes: 0,
      tests: 0,
      components: 0
    };
  }

  /**
   * Scan project structure and update statistics
   */
  scanProject() {
    try {
      // Count services
      const servicesDir = path.join(this.projectRoot, 'apps/api/src/services');
      if (fs.existsSync(servicesDir)) {
        this.stats.services = fs.readdirSync(servicesDir)
          .filter(file => file.endsWith('-service.ts')).length;
      }

      // Count routes
      const routesDir = path.join(this.projectRoot, 'apps/api/src/routes');
      if (fs.existsSync(routesDir)) {
        this.stats.routes = fs.readdirSync(routesDir)
          .filter(file => file.endsWith('.ts')).length;
      }

      // Count tests
      const testsDir = path.join(this.projectRoot, 'apps/api/src/__tests__');
      if (fs.existsSync(testsDir)) {
        this.stats.tests = fs.readdirSync(testsDir)
          .filter(file => file.endsWith('.test.ts')).length;
      }

      // Count components
      const componentsDir = path.join(this.projectRoot, 'apps/web/components');
      if (fs.existsSync(componentsDir)) {
        this.stats.components = fs.readdirSync(componentsDir)
          .filter(file => file.endsWith('.tsx')).length;
      }

      console.log('📊 Project Statistics Updated:');
      console.log(`   Services: ${this.stats.services}`);
      console.log(`   Routes: ${this.stats.routes}`);
      console.log(`   Tests: ${this.stats.tests}`);
      console.log(`   Components: ${this.stats.components}`);

    } catch (error) {
      console.error('Error scanning project:', error.message);
    }
  }

  /**
   * Get current git status and task progress
   */
  getProjectStatus() {
    try {
      // Get current branch
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      }).trim();

      // Get uncommitted changes count
      const uncommittedFiles = execSync('git status --porcelain', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      }).split('\n').filter(line => line.trim()).length;

      // Get last commit info
      const lastCommit = execSync('git log -1 --pretty=format:"%h - %s (%cr)"', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      }).trim();

      return {
        branch: currentBranch,
        uncommittedFiles,
        lastCommit,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting git status:', error.message);
      return {
        branch: 'unknown',
        uncommittedFiles: 0,
        lastCommit: 'unknown',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Update the context file with current information
   */
  updateContextFile() {
    try {
      if (!fs.existsSync(this.contextFile)) {
        console.error('Context file not found. Please create .cursor-context.md first.');
        return false;
      }

      let content = fs.readFileSync(this.contextFile, 'utf8');
      const status = this.getProjectStatus();

      // Update statistics in the project structure section
      content = content.replace(
        /# API endpoints \(\d+\+ route files\)/g,
        `# API endpoints (${this.stats.routes}+ route files)`
      );

      content = content.replace(
        /# Business logic services \(\d+\+ services\)/g,
        `# Business logic services (${this.stats.services}+ services)`
      );

      // Update timestamp at the bottom
      content = content.replace(
        /\*Last Updated: .*\*/g,
        `*Last Updated: ${status.timestamp}*`
      );

      // Add current status section if it doesn't exist
      const statusSection = `

## 🔄 Current Project Status

- **Branch:** ${status.branch}
- **Uncommitted Files:** ${status.uncommittedFiles}
- **Last Commit:** ${status.lastCommit}
- **Services Count:** ${this.stats.services}
- **Routes Count:** ${this.stats.routes}
- **Tests Count:** ${this.stats.tests}
- **Components Count:** ${this.stats.components}
- **Last Context Update:** ${status.timestamp}

---`;

      // Insert status section before the final note
      if (!content.includes('## 🔄 Current Project Status')) {
        content = content.replace(
          /---\n\n\*\*Remember:/g,
          statusSection + '\n\n**Remember:'
        );
      } else {
        // Update existing status section
        content = content.replace(
          /## 🔄 Current Project Status[\s\S]*?---/g,
          statusSection
        );
      }

      fs.writeFileSync(this.contextFile, content);
      console.log('✅ Context file updated successfully');
      return true;

    } catch (error) {
      console.error('Error updating context file:', error.message);
      return false;
    }
  }

  /**
   * Main execution function
   */
  run() {
    console.log('🔄 Updating project context...');
    this.scanProject();
    const success = this.updateContextFile();

    if (success) {
      console.log('✅ Context update completed successfully');
    } else {
      console.log('❌ Context update failed');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const updater = new ContextUpdater();
  updater.run();
}

module.exports = ContextUpdater;
