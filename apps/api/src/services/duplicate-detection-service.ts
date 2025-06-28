import { EventEmitter } from 'events';
import Redis from 'ioredis';

// =============================================================================
// CORE INTERFACES - Universal Duplicate Detection System
// =============================================================================

export interface DuplicateRecord {
  id: string;
  sourceRecordId: string;
  duplicateRecordId: string;
  recordType: string; // 'contact', 'lead', 'account', 'opportunity', etc.
  sourceSystem: string;
  duplicateSystem: string;
  confidenceScore: number; // 0-100
  matchedFields: MatchedField[];
  detectionMethod: 'fuzzy' | 'exact' | 'phonetic' | 'semantic' | 'hybrid';
  status: 'pending' | 'reviewed' | 'merged' | 'ignored' | 'false_positive';
  reviewedBy?: string;
  reviewedAt?: Date;
  mergeStrategy?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchedField {
  fieldName: string;
  sourceValue: any;
  duplicateValue: any;
  similarity: number; // 0-1
  algorithm: string;
  weight: number;
  isExactMatch: boolean;
}

export interface MatchingRule {
  id: string;
  name: string;
  recordType: string;
  isActive: boolean;
  fields: FieldMatchingConfig[];
  thresholds: {
    autoMerge: number; // Confidence score for automatic merging
    humanReview: number; // Confidence score requiring human review
    ignore: number; // Below this score, ignore as duplicate
  };
  algorithms: MatchingAlgorithm[];
  excludeRules: ExclusionRule[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldMatchingConfig {
  fieldName: string;
  dataType: 'string' | 'email' | 'phone' | 'number' | 'date' | 'boolean';
  weight: number; // Importance weight for this field
  algorithms: string[]; // Which algorithms to use for this field
  normalizeBeforeMatch: boolean;
  caseSensitive: boolean;
  ignoreSpecialChars: boolean;
  minimumSimilarity: number; // Minimum similarity to consider a match
}

export interface MatchingAlgorithm {
  name: string;
  type: 'exact' | 'fuzzy' | 'phonetic' | 'semantic';
  parameters: Record<string, any>;
  applicableDataTypes: string[];
  isDefault: boolean;
}

export interface ExclusionRule {
  id: string;
  fieldName: string;
  condition: 'equals' | 'not_equals' | 'contains' | 'regex' | 'custom';
  value: any;
  description: string;
  isActive: boolean;
}

export interface DeduplicationStrategy {
  id: string;
  name: string;
  recordType: string;
  mergeRules: MergeRule[];
  conflictResolution: ConflictResolution[];
  preserveAuditTrail: boolean;
  backupBeforeMerge: boolean;
  isDefault: boolean;
}

export interface MergeRule {
  fieldName: string;
  strategy: 'keep_source' | 'keep_target' | 'merge' | 'newest' | 'oldest' | 'longest' | 'custom';
  customFunction?: string; // JavaScript function for custom merge logic
  priority: number;
}

export interface ConflictResolution {
  fieldName: string;
  resolutionType: 'manual' | 'automatic';
  automaticRule?: 'source_wins' | 'target_wins' | 'most_recent' | 'most_complete';
  requiresApproval: boolean;
}

export interface DuplicateScore {
  totalScore: number; // 0-100
  fieldScores: FieldScore[];
  algorithmScores: Record<string, number>;
  weightedScore: number;
  confidence: 'low' | 'medium' | 'high' | 'very_high';
  recommendation: 'ignore' | 'review' | 'auto_merge';
}

export interface FieldScore {
  fieldName: string;
  score: number;
  weight: number;
  contribution: number; // How much this field contributed to total score
  algorithm: string;
  details: Record<string, any>;
}

export interface ResolutionWorkflow {
  id: string;
  duplicateId: string;
  workflowType: 'automatic' | 'manual' | 'hybrid';
  steps: WorkflowStep[];
  currentStep: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  assignedTo?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  type: 'validation' | 'approval' | 'merge' | 'notification' | 'custom';
  description: string;
  status: 'pending' | 'completed' | 'skipped' | 'failed';
  assignedTo?: string;
  completedBy?: string;
  completedAt?: Date;
  result?: any;
  notes?: string;
}

export interface BatchDetectionJob {
  id: string;
  name: string;
  recordType: string;
  sourceSystem: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    totalRecords: number;
    processedRecords: number;
    duplicatesFound: number;
    errors: number;
    startTime: Date;
    endTime?: Date;
    estimatedCompletion?: Date;
  };
  filters?: Record<string, any>;
  options: {
    batchSize: number;
    maxConcurrency: number;
    skipRecentlyProcessed: boolean;
    autoMergeThreshold?: number;
  };
  results?: BatchDetectionResult;
  createdBy: string;
  createdAt: Date;
}

export interface BatchDetectionResult {
  duplicatesFound: number;
  autoMerged: number;
  requiresReview: number;
  falsePositives: number;
  errors: BatchError[];
  performance: {
    totalTime: number;
    averageTimePerRecord: number;
    recordsPerSecond: number;
  };
  summary: Record<string, any>;
}

export interface BatchError {
  recordId: string;
  error: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface DuplicateMetrics {
  totalDuplicates: number;
  duplicatesByStatus: Record<string, number>;
  duplicatesByType: Record<string, number>;
  duplicatesBySystem: Record<string, number>;
  averageConfidenceScore: number;
  detectionAccuracy: number;
  falsePositiveRate: number;
  autoMergeRate: number;
  manualReviewRate: number;
  processingMetrics: {
    averageDetectionTime: number;
    recordsProcessedToday: number;
    duplicatesFoundToday: number;
    systemPerformance: 'excellent' | 'good' | 'fair' | 'poor';
  };
  algorithmPerformance: Record<string, {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }>;
}

export interface DuplicateFilters {
  recordType?: string;
  sourceSystem?: string;
  status?: string;
  confidenceMin?: number;
  confidenceMax?: number;
  detectionMethod?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  reviewedBy?: string;
  requiresReview?: boolean;
}

// =============================================================================
// UNIVERSAL DUPLICATE DETECTION SERVICE
// =============================================================================

export class DuplicateDetectionService extends EventEmitter {
  private redis: Redis;
  private duplicates: Map<string, DuplicateRecord> = new Map();
  private matchingRules: Map<string, MatchingRule> = new Map();
  private deduplicationStrategies: Map<string, DeduplicationStrategy> = new Map();
  private workflows: Map<string, ResolutionWorkflow> = new Map();
  private batchJobs: Map<string, BatchDetectionJob> = new Map();
  private metricsCache: DuplicateMetrics | null = null;
  private metricsInterval?: NodeJS.Timeout;

  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.initializeMatchingRules();
    this.initializeDeduplicationStrategies();
    this.startMetricsCalculation();
    this.generateMockData();
  }

  // =============================================================================
  // CORE DUPLICATE DETECTION
  // =============================================================================

  async detectDuplicates(
    recordData: any,
    recordType: string,
    sourceSystem: string,
    options?: {
      ruleId?: string;
      realTime?: boolean;
      autoMerge?: boolean;
      skipCache?: boolean;
    }
  ): Promise<DuplicateRecord[]> {
    const startTime = Date.now();
    const detectedDuplicates: DuplicateRecord[] = [];

    try {
      // Get matching rules for this record type
      const rules = this.getMatchingRulesForType(recordType);
      const activeRule = options?.ruleId
        ? rules.find(r => r.id === options.ruleId)
        : rules.find(r => r.isActive) || rules[0];

      if (!activeRule) {
        throw new Error(`No matching rules found for record type: ${recordType}`);
      }

      // Get candidate records for comparison
      const candidates = await this.getCandidateRecords(recordData, recordType, sourceSystem);

      // Compare against each candidate
      for (const candidate of candidates) {
        const duplicateScore = await this.calculateDuplicateScore(
          recordData,
          candidate,
          activeRule
        );

        if (duplicateScore.totalScore >= activeRule.thresholds.ignore) {
          const duplicate: DuplicateRecord = {
            id: this.generateId(),
            sourceRecordId: recordData.id || this.generateId(),
            duplicateRecordId: candidate.id,
            recordType,
            sourceSystem,
            duplicateSystem: candidate.system || sourceSystem,
            confidenceScore: duplicateScore.totalScore,
            matchedFields: duplicateScore.fieldScores.map(fs => ({
              fieldName: fs.fieldName,
              sourceValue: recordData[fs.fieldName],
              duplicateValue: candidate[fs.fieldName],
              similarity: fs.score / 100,
              algorithm: fs.algorithm,
              weight: fs.weight,
              isExactMatch: fs.score === 100
            })),
            detectionMethod: 'hybrid',
            status: duplicateScore.recommendation === 'auto_merge' ? 'pending' : 'pending',
            metadata: {
              detectionTime: Date.now() - startTime,
              ruleId: activeRule.id,
              confidence: duplicateScore.confidence,
              recommendation: duplicateScore.recommendation
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };

          detectedDuplicates.push(duplicate);
          this.duplicates.set(duplicate.id, duplicate);

          // Auto-merge if enabled and score is high enough
          if (options?.autoMerge && duplicateScore.totalScore >= activeRule.thresholds.autoMerge) {
            await this.autoMergeDuplicate(duplicate.id);
          }

          // Emit real-time event
          if (options?.realTime) {
            this.emit('duplicateDetected', {
              duplicate,
              score: duplicateScore,
              timestamp: new Date()
            });
          }
        }
      }

      // Persist results
      await this.persistDuplicates(detectedDuplicates);

      return detectedDuplicates;

    } catch (error) {
      this.emit('detectionError', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recordData,
        recordType,
        sourceSystem,
        timestamp: new Date()
      });
      throw error;
    }
  }

  async calculateDuplicateScore(
    sourceRecord: any,
    candidateRecord: any,
    rule: MatchingRule
  ): Promise<DuplicateScore> {
    const fieldScores: FieldScore[] = [];
    const algorithmScores: Record<string, number> = {};
    let totalWeightedScore = 0;
    let totalWeight = 0;

    // Calculate score for each configured field
    for (const fieldConfig of rule.fields) {
      const sourceValue = sourceRecord[fieldConfig.fieldName];
      const candidateValue = candidateRecord[fieldConfig.fieldName];

      if (sourceValue === undefined || candidateValue === undefined) {
        continue; // Skip missing fields
      }

      let bestScore = 0;
      let bestAlgorithm = '';

      // Try each configured algorithm for this field
      for (const algorithmName of fieldConfig.algorithms) {
        const score = await this.calculateFieldSimilarity(
          sourceValue,
          candidateValue,
          algorithmName,
          fieldConfig
        );

        if (score > bestScore) {
          bestScore = score;
          bestAlgorithm = algorithmName;
        }

        // Track algorithm performance
        if (!algorithmScores[algorithmName]) {
          algorithmScores[algorithmName] = 0;
        }
        algorithmScores[algorithmName] += score;
      }

      // Only include if meets minimum similarity
      if (bestScore >= fieldConfig.minimumSimilarity) {
        const contribution = (bestScore * fieldConfig.weight) / 100;
        fieldScores.push({
          fieldName: fieldConfig.fieldName,
          score: bestScore * 100, // Convert to 0-100 scale
          weight: fieldConfig.weight,
          contribution,
          algorithm: bestAlgorithm,
          details: {
            sourceValue,
            candidateValue,
            normalized: fieldConfig.normalizeBeforeMatch
          }
        });

        totalWeightedScore += contribution;
        totalWeight += fieldConfig.weight;
      }
    }

    // Calculate final score
    const finalScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

    // Determine confidence level
    let confidence: 'low' | 'medium' | 'high' | 'very_high';
    if (finalScore >= 90) confidence = 'very_high';
    else if (finalScore >= 75) confidence = 'high';
    else if (finalScore >= 50) confidence = 'medium';
    else confidence = 'low';

    // Determine recommendation
    let recommendation: 'ignore' | 'review' | 'auto_merge';
    if (finalScore >= rule.thresholds.autoMerge) recommendation = 'auto_merge';
    else if (finalScore >= rule.thresholds.humanReview) recommendation = 'review';
    else recommendation = 'ignore';

    return {
      totalScore: finalScore,
      fieldScores,
      algorithmScores,
      weightedScore: totalWeightedScore,
      confidence,
      recommendation
    };
  }

  private async calculateFieldSimilarity(
    value1: any,
    value2: any,
    algorithm: string,
    config: FieldMatchingConfig
  ): Promise<number> {
    // Normalize values if configured
    let normalized1 = value1;
    let normalized2 = value2;

    if (config.normalizeBeforeMatch) {
      normalized1 = this.normalizeValue(value1, config);
      normalized2 = this.normalizeValue(value2, config);
    }

    // Convert to strings for comparison
    const str1 = String(normalized1);
    const str2 = String(normalized2);

    // Handle case sensitivity
    const compareStr1 = config.caseSensitive ? str1 : str1.toLowerCase();
    const compareStr2 = config.caseSensitive ? str2 : str2.toLowerCase();

    // Apply algorithm
    switch (algorithm) {
      case 'exact':
        return compareStr1 === compareStr2 ? 1 : 0;

      case 'levenshtein':
        return this.levenshteinSimilarity(compareStr1, compareStr2);

      case 'jaro_winkler':
        return this.jaroWinklerSimilarity(compareStr1, compareStr2);

      case 'soundex':
        return this.soundexMatch(compareStr1, compareStr2) ? 1 : 0;

      case 'fuzzy':
        return this.fuzzyMatch(compareStr1, compareStr2);

      case 'email':
        return this.emailSimilarity(compareStr1, compareStr2);

      case 'phone':
        return this.phoneSimilarity(compareStr1, compareStr2);

      default:
        return this.levenshteinSimilarity(compareStr1, compareStr2);
    }
  }

  // =============================================================================
  // SIMILARITY ALGORITHMS
  // =============================================================================

  private levenshteinSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private jaroWinklerSimilarity(str1: string, str2: string): number {
    const jaro = this.jaroSimilarity(str1, str2);
    if (jaro < 0.7) return jaro;

    // Calculate common prefix length (up to 4 characters)
    let prefixLength = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
      if (str1[i] === str2[i]) prefixLength++;
      else break;
    }

    return jaro + (0.1 * prefixLength * (1 - jaro));
  }

  private jaroSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, str2.length);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    return (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;
  }

  private soundexMatch(str1: string, str2: string): boolean {
    return this.soundex(str1) === this.soundex(str2);
  }

  private soundex(str: string): string {
    const code = str.toUpperCase().replace(/[^A-Z]/g, '');
    if (code.length === 0) return '0000';

    let result = code[0];
    const mapping: Record<string, string> = {
      'BFPV': '1', 'CGJKQSXZ': '2', 'DT': '3',
      'L': '4', 'MN': '5', 'R': '6'
    };

    for (let i = 1; i < code.length; i++) {
      const char = code[i];
      let digit = '0';

      for (const [chars, value] of Object.entries(mapping)) {
        if (chars.includes(char)) {
          digit = value;
          break;
        }
      }

      if (digit !== '0' && digit !== result[result.length - 1]) {
        result += digit;
      }

      if (result.length === 4) break;
    }

    return result.padEnd(4, '0');
  }

  private fuzzyMatch(str1: string, str2: string): number {
    // Simple fuzzy matching using character frequency
    const freq1 = this.getCharFrequency(str1);
    const freq2 = this.getCharFrequency(str2);

    const allChars = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
    let similarity = 0;

    for (const char of allChars) {
      const count1 = freq1[char] || 0;
      const count2 = freq2[char] || 0;
      similarity += Math.min(count1, count2);
    }

    const maxLength = Math.max(str1.length, str2.length);
    return maxLength > 0 ? similarity / maxLength : 0;
  }

  private getCharFrequency(str: string): Record<string, number> {
    const freq: Record<string, number> = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
  }

  private emailSimilarity(email1: string, email2: string): number {
    // Extract local and domain parts
    const [local1, domain1] = email1.split('@');
    const [local2, domain2] = email2.split('@');

    if (!domain1 || !domain2) return 0;

    // Domain must match exactly for emails
    if (domain1.toLowerCase() !== domain2.toLowerCase()) return 0;

    // Compare local parts with fuzzy matching
    return this.levenshteinSimilarity(local1.toLowerCase(), local2.toLowerCase());
  }

  private phoneSimilarity(phone1: string, phone2: string): number {
    // Normalize phone numbers (remove non-digits)
    const normalized1 = phone1.replace(/\D/g, '');
    const normalized2 = phone2.replace(/\D/g, '');

    // Exact match for normalized phones
    if (normalized1 === normalized2) return 1;

    // Check if one is a subset of the other (international vs local)
    if (normalized1.length !== normalized2.length) {
      const shorter = normalized1.length < normalized2.length ? normalized1 : normalized2;
      const longer = normalized1.length < normalized2.length ? normalized2 : normalized1;

      if (longer.endsWith(shorter)) return 0.9; // High but not perfect match
    }

    return this.levenshteinSimilarity(normalized1, normalized2);
  }

  private normalizeValue(value: any, config: FieldMatchingConfig): any {
    if (typeof value !== 'string') return value;

    let normalized = value;

    // Remove special characters if configured
    if (config.ignoreSpecialChars) {
      normalized = normalized.replace(/[^\w\s]/g, '');
    }

    // Trim whitespace
    normalized = normalized.trim();

    // Handle case sensitivity
    if (!config.caseSensitive) {
      normalized = normalized.toLowerCase();
    }

    return normalized;
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private getMatchingRulesForType(recordType: string): MatchingRule[] {
    return Array.from(this.matchingRules.values())
      .filter(rule => rule.recordType === recordType || rule.recordType === 'universal');
  }

  private async getCandidateRecords(
    recordData: any,
    recordType: string,
    sourceSystem: string
  ): Promise<any[]> {
    // In a real implementation, this would query the database
    // For now, return mock candidates
    return this.generateMockCandidates(recordData, recordType);
  }

  private generateMockCandidates(recordData: any, recordType: string): any[] {
    // Generate realistic candidate records for testing
    const candidates = [];

    if (recordType === 'contact') {
      candidates.push(
        {
          id: 'candidate_1',
          firstName: recordData.firstName,
          lastName: recordData.lastName + 'son', // Similar but not exact
          email: recordData.email?.replace('@', '+duplicate@'),
          phone: recordData.phone,
          system: 'salesforce'
        },
        {
          id: 'candidate_2',
          firstName: recordData.firstName?.substring(0, 3) + 'othy', // Partial match
          lastName: recordData.lastName,
          email: recordData.email,
          phone: recordData.phone?.replace(/\d$/, '9'), // Similar phone
          system: 'hubspot'
        }
      );
    }

    return candidates;
  }

  private generateId(): string {
    return 'dup_' + Math.random().toString(36).substr(2, 9);
  }

  private async persistDuplicates(duplicates: DuplicateRecord[]): Promise<void> {
    for (const duplicate of duplicates) {
      await this.redis.setex(
        `duplicate:${duplicate.id}`,
        300, // 5 minutes TTL
        JSON.stringify(duplicate)
      );
    }
  }

  // =============================================================================
  // AUTO-MERGE AND RESOLUTION
  // =============================================================================

  async autoMergeDuplicate(duplicateId: string): Promise<boolean> {
    try {
      const duplicate = this.duplicates.get(duplicateId);
      if (!duplicate) {
        throw new Error(`Duplicate not found: ${duplicateId}`);
      }

      // Get deduplication strategy
      const strategy = this.getDeduplicationStrategy(duplicate.recordType);
      if (!strategy) {
        throw new Error(`No deduplication strategy found for: ${duplicate.recordType}`);
      }

      // Create backup if configured
      if (strategy.backupBeforeMerge) {
        await this.createMergeBackup(duplicate);
      }

      // Perform merge
      const mergeResult = await this.performMerge(duplicate, strategy);

      // Update duplicate status
      duplicate.status = 'merged';
      duplicate.updatedAt = new Date();
      duplicate.metadata.mergeResult = mergeResult;

      // Emit event
      this.emit('duplicateMerged', {
        duplicate,
        mergeResult,
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      this.emit('mergeError', {
        duplicateId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
      return false;
    }
  }

  private getDeduplicationStrategy(recordType: string): DeduplicationStrategy | null {
    return Array.from(this.deduplicationStrategies.values())
      .find(s => s.recordType === recordType && s.isDefault) ||
      Array.from(this.deduplicationStrategies.values())
      .find(s => s.recordType === 'universal') || null;
  }

  private async createMergeBackup(duplicate: DuplicateRecord): Promise<void> {
    const backupKey = `backup:${duplicate.id}:${Date.now()}`;
    await this.redis.setex(
      backupKey,
      86400, // 24 hours TTL
      JSON.stringify({
        duplicate,
        timestamp: new Date()
      })
    );
  }

  private async performMerge(
    duplicate: DuplicateRecord,
    strategy: DeduplicationStrategy
  ): Promise<any> {
    // In a real implementation, this would merge records in the actual CRM
    // For now, return a mock merge result
    return {
      mergedRecordId: duplicate.sourceRecordId,
      removedRecordId: duplicate.duplicateRecordId,
      mergedFields: duplicate.matchedFields.map(f => f.fieldName),
      strategy: strategy.name,
      timestamp: new Date()
    };
  }

  // =============================================================================
  // WORKFLOW MANAGEMENT
  // =============================================================================

  async createResolutionWorkflow(
    duplicateId: string,
    workflowType: 'automatic' | 'manual' | 'hybrid',
    options?: {
      assignTo?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      dueDate?: Date;
    }
  ): Promise<ResolutionWorkflow> {
    const duplicate = this.duplicates.get(duplicateId);
    if (!duplicate) {
      throw new Error(`Duplicate not found: ${duplicateId}`);
    }

    const workflow: ResolutionWorkflow = {
      id: this.generateId(),
      duplicateId,
      workflowType,
      steps: this.generateWorkflowSteps(workflowType, duplicate),
      currentStep: 0,
      status: 'pending',
      assignedTo: options?.assignTo,
      dueDate: options?.dueDate,
      priority: options?.priority || 'medium',
      metadata: {
        createdFor: duplicate.recordType,
        confidenceScore: duplicate.confidenceScore
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(workflow.id, workflow);

    this.emit('workflowCreated', {
      workflow,
      duplicate,
      timestamp: new Date()
    });

    return workflow;
  }

  private generateWorkflowSteps(
    workflowType: string,
    duplicate: DuplicateRecord
  ): WorkflowStep[] {
    const steps: WorkflowStep[] = [];

    if (workflowType === 'manual' || workflowType === 'hybrid') {
      steps.push({
        id: this.generateId(),
        stepNumber: 1,
        type: 'validation',
        description: 'Validate duplicate detection accuracy',
        status: 'pending'
      });

      steps.push({
        id: this.generateId(),
        stepNumber: 2,
        type: 'approval',
        description: 'Approve merge operation',
        status: 'pending'
      });
    }

    steps.push({
      id: this.generateId(),
      stepNumber: steps.length + 1,
      type: 'merge',
      description: 'Execute record merge',
      status: 'pending'
    });

    steps.push({
      id: this.generateId(),
      stepNumber: steps.length + 1,
      type: 'notification',
      description: 'Notify stakeholders of merge completion',
      status: 'pending'
    });

    return steps;
  }

  async advanceWorkflow(workflowId: string, stepResult?: any): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    const currentStep = workflow.steps[workflow.currentStep];
    if (!currentStep) return false;

    // Mark current step as completed
    currentStep.status = 'completed';
    currentStep.completedAt = new Date();
    currentStep.result = stepResult;

    // Advance to next step
    workflow.currentStep++;
    workflow.updatedAt = new Date();

    // Check if workflow is complete
    if (workflow.currentStep >= workflow.steps.length) {
      workflow.status = 'completed';
      this.emit('workflowCompleted', {
        workflow,
        timestamp: new Date()
      });
    }

    return true;
  }

  // =============================================================================
  // BATCH PROCESSING
  // =============================================================================

  async startBatchDetection(
    recordType: string,
    sourceSystem: string,
    options: {
      batchSize?: number;
      maxConcurrency?: number;
      filters?: Record<string, any>;
      autoMergeThreshold?: number;
    }
  ): Promise<BatchDetectionJob> {
    const job: BatchDetectionJob = {
      id: this.generateId(),
      name: `Batch Detection - ${recordType} - ${new Date().toISOString()}`,
      recordType,
      sourceSystem,
      status: 'queued',
      progress: {
        totalRecords: 0,
        processedRecords: 0,
        duplicatesFound: 0,
        errors: 0,
        startTime: new Date()
      },
      filters: options.filters,
      options: {
        batchSize: options.batchSize || 100,
        maxConcurrency: options.maxConcurrency || 5,
        skipRecentlyProcessed: true,
        autoMergeThreshold: options.autoMergeThreshold
      },
      createdBy: 'system',
      createdAt: new Date()
    };

    this.batchJobs.set(job.id, job);

    // Start processing in background
    this.processBatchJob(job.id);

    return job;
  }

  private async processBatchJob(jobId: string): Promise<void> {
    const job = this.batchJobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'running';
      job.progress.startTime = new Date();

      // Get records to process (mock implementation)
      const records = await this.getRecordsForBatchProcessing(job);
      job.progress.totalRecords = records.length;

      const results: BatchDetectionResult = {
        duplicatesFound: 0,
        autoMerged: 0,
        requiresReview: 0,
        falsePositives: 0,
        errors: [],
        performance: {
          totalTime: 0,
          averageTimePerRecord: 0,
          recordsPerSecond: 0
        },
        summary: {}
      };

      // Process records in batches
      for (let i = 0; i < records.length; i += job.options.batchSize) {
        const batch = records.slice(i, i + job.options.batchSize);

        for (const record of batch) {
          try {
            const duplicates = await this.detectDuplicates(
              record,
              job.recordType,
              job.sourceSystem,
              {
                autoMerge: job.options.autoMergeThreshold !== undefined,
                realTime: false
              }
            );

            results.duplicatesFound += duplicates.length;
            job.progress.duplicatesFound += duplicates.length;

            // Count auto-merged vs requiring review
            for (const duplicate of duplicates) {
              if (duplicate.status === 'merged') {
                results.autoMerged++;
              } else {
                results.requiresReview++;
              }
            }

          } catch (error) {
            results.errors.push({
              recordId: record.id,
              error: error instanceof Error ? error.message : 'Unknown error',
              severity: 'medium',
              timestamp: new Date()
            });
            job.progress.errors++;
          }

          job.progress.processedRecords++;
        }

        // Emit progress update
        this.emit('batchProgress', {
          jobId,
          progress: job.progress,
          timestamp: new Date()
        });
      }

      // Calculate performance metrics
      const endTime = new Date();
      results.performance.totalTime = endTime.getTime() - job.progress.startTime.getTime();
      results.performance.averageTimePerRecord = results.performance.totalTime / job.progress.totalRecords;
      results.performance.recordsPerSecond = job.progress.totalRecords / (results.performance.totalTime / 1000);

      job.status = 'completed';
      job.progress.endTime = endTime;
      job.results = results;

      this.emit('batchCompleted', {
        job,
        results,
        timestamp: new Date()
      });

    } catch (error) {
      job.status = 'failed';
      this.emit('batchFailed', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }
  }

  private async getRecordsForBatchProcessing(job: BatchDetectionJob): Promise<any[]> {
    // Mock implementation - in real scenario, this would query the database
    return Array.from({ length: 1000 }, (_, i) => ({
      id: `record_${i}`,
      firstName: `Test${i}`,
      lastName: `User${i}`,
      email: `test${i}@example.com`,
      phone: `555-000-${String(i).padStart(4, '0')}`
    }));
  }

  // =============================================================================
  // METRICS AND MONITORING
  // =============================================================================

  private startMetricsCalculation(): void {
    // Calculate metrics every 30 minutes
    this.metricsInterval = setInterval(() => {
      this.calculateMetrics();
    }, 30 * 60 * 1000);

    // Calculate initial metrics
    this.calculateMetrics();
  }

  private calculateMetrics(): void {
    const duplicates = Array.from(this.duplicates.values());
    const workflows = Array.from(this.workflows.values());
    const batchJobs = Array.from(this.batchJobs.values());

    // Basic counts
    const totalDuplicates = duplicates.length;
    const duplicatesByStatus = duplicates.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const duplicatesByType = duplicates.reduce((acc, d) => {
      acc[d.recordType] = (acc[d.recordType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const duplicatesBySystem = duplicates.reduce((acc, d) => {
      const key = `${d.sourceSystem}->${d.duplicateSystem}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate averages
    const averageConfidenceScore = duplicates.length > 0
      ? duplicates.reduce((sum, d) => sum + d.confidenceScore, 0) / duplicates.length
      : 0;

    // Calculate rates
    const reviewedDuplicates = duplicates.filter(d => d.status === 'reviewed' || d.status === 'merged');
    const falsePositives = duplicates.filter(d => d.status === 'false_positive');
    const autoMerged = duplicates.filter(d => d.status === 'merged');
    const requiresReview = duplicates.filter(d => d.status === 'pending');

    const detectionAccuracy = reviewedDuplicates.length > 0
      ? ((reviewedDuplicates.length - falsePositives.length) / reviewedDuplicates.length) * 100
      : 0;

    const falsePositiveRate = reviewedDuplicates.length > 0
      ? (falsePositives.length / reviewedDuplicates.length) * 100
      : 0;

    const autoMergeRate = duplicates.length > 0
      ? (autoMerged.length / duplicates.length) * 100
      : 0;

    const manualReviewRate = duplicates.length > 0
      ? (requiresReview.length / duplicates.length) * 100
      : 0;

    // Processing metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDuplicates = duplicates.filter(d => d.createdAt >= today);

    const averageDetectionTime = duplicates.length > 0
      ? duplicates
          .filter(d => d.metadata.detectionTime)
          .reduce((sum, d) => sum + (d.metadata.detectionTime || 0), 0) / duplicates.length
      : 0;

    // System performance assessment
    let systemPerformance: 'excellent' | 'good' | 'fair' | 'poor';
    if (averageDetectionTime < 100 && falsePositiveRate < 5) systemPerformance = 'excellent';
    else if (averageDetectionTime < 500 && falsePositiveRate < 10) systemPerformance = 'good';
    else if (averageDetectionTime < 1000 && falsePositiveRate < 20) systemPerformance = 'fair';
    else systemPerformance = 'poor';

    // Algorithm performance (mock data for now)
    const algorithmPerformance = {
      'levenshtein': { accuracy: 85, precision: 82, recall: 88, f1Score: 85 },
      'jaro_winkler': { accuracy: 88, precision: 86, recall: 90, f1Score: 88 },
      'soundex': { accuracy: 70, precision: 75, recall: 65, f1Score: 70 },
      'fuzzy': { accuracy: 80, precision: 78, recall: 82, f1Score: 80 },
      'exact': { accuracy: 100, precision: 100, recall: 60, f1Score: 75 }
    };

    this.metricsCache = {
      totalDuplicates,
      duplicatesByStatus,
      duplicatesByType,
      duplicatesBySystem,
      averageConfidenceScore,
      detectionAccuracy,
      falsePositiveRate,
      autoMergeRate,
      manualReviewRate,
      processingMetrics: {
        averageDetectionTime,
        recordsProcessedToday: todayDuplicates.length,
        duplicatesFoundToday: todayDuplicates.length,
        systemPerformance
      },
      algorithmPerformance
    };

    // Cache metrics in Redis
    this.redis.setex(
      'duplicate_detection:metrics',
      300, // 5 minutes TTL
      JSON.stringify(this.metricsCache)
    );
  }

  getMetrics(): DuplicateMetrics | null {
    return this.metricsCache;
  }

  // =============================================================================
  // DATA ACCESS METHODS
  // =============================================================================

  getDuplicates(filters?: DuplicateFilters): DuplicateRecord[] {
    let duplicates = Array.from(this.duplicates.values());

    if (filters) {
      if (filters.recordType) {
        duplicates = duplicates.filter(d => d.recordType === filters.recordType);
      }
      if (filters.sourceSystem) {
        duplicates = duplicates.filter(d => d.sourceSystem === filters.sourceSystem);
      }
      if (filters.status) {
        duplicates = duplicates.filter(d => d.status === filters.status);
      }
      if (filters.confidenceMin !== undefined) {
        duplicates = duplicates.filter(d => d.confidenceScore >= filters.confidenceMin!);
      }
      if (filters.confidenceMax !== undefined) {
        duplicates = duplicates.filter(d => d.confidenceScore <= filters.confidenceMax!);
      }
      if (filters.detectionMethod) {
        duplicates = duplicates.filter(d => d.detectionMethod === filters.detectionMethod);
      }
      if (filters.createdAfter) {
        duplicates = duplicates.filter(d => d.createdAt >= filters.createdAfter!);
      }
      if (filters.createdBefore) {
        duplicates = duplicates.filter(d => d.createdAt <= filters.createdBefore!);
      }
      if (filters.reviewedBy) {
        duplicates = duplicates.filter(d => d.reviewedBy === filters.reviewedBy);
      }
      if (filters.requiresReview) {
        duplicates = duplicates.filter(d => d.status === 'pending');
      }
    }

    return duplicates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getDuplicate(duplicateId: string): DuplicateRecord | null {
    return this.duplicates.get(duplicateId) || null;
  }

  getWorkflows(filters?: { status?: string; assignedTo?: string }): ResolutionWorkflow[] {
    let workflows = Array.from(this.workflows.values());

    if (filters) {
      if (filters.status) {
        workflows = workflows.filter(w => w.status === filters.status);
      }
      if (filters.assignedTo) {
        workflows = workflows.filter(w => w.assignedTo === filters.assignedTo);
      }
    }

    return workflows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getBatchJobs(filters?: { status?: string; recordType?: string }): BatchDetectionJob[] {
    let jobs = Array.from(this.batchJobs.values());

    if (filters) {
      if (filters.status) {
        jobs = jobs.filter(j => j.status === filters.status);
      }
      if (filters.recordType) {
        jobs = jobs.filter(j => j.recordType === filters.recordType);
      }
    }

    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // =============================================================================
  // CONFIGURATION MANAGEMENT
  // =============================================================================

  async updateMatchingRule(ruleId: string, updates: Partial<MatchingRule>): Promise<MatchingRule | null> {
    const rule = this.matchingRules.get(ruleId);
    if (!rule) return null;

    Object.assign(rule, updates, { updatedAt: new Date() });

    await this.redis.setex(
      `matching_rule:${ruleId}`,
      3600, // 1 hour TTL
      JSON.stringify(rule)
    );

    this.emit('ruleUpdated', { rule, timestamp: new Date() });
    return rule;
  }

  getMatchingRules(): MatchingRule[] {
    return Array.from(this.matchingRules.values());
  }

  getDeduplicationStrategies(): DeduplicationStrategy[] {
    return Array.from(this.deduplicationStrategies.values());
  }

  // =============================================================================
  // HEALTH CHECK
  // =============================================================================

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    duplicates: number;
    pendingWorkflows: number;
    activeBatchJobs: number;
    metricsStatus: 'active' | 'inactive';
    averageDetectionTime: number;
    errorRate: number;
  }> {
    const duplicates = this.duplicates.size;
    const pendingWorkflows = Array.from(this.workflows.values())
      .filter(w => w.status === 'pending' || w.status === 'in_progress').length;
    const activeBatchJobs = Array.from(this.batchJobs.values())
      .filter(j => j.status === 'running' || j.status === 'queued').length;

    const metrics = this.getMetrics();
    const averageDetectionTime = metrics?.processingMetrics.averageDetectionTime || 0;
    const errorRate = metrics?.falsePositiveRate || 0;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (averageDetectionTime < 500 && errorRate < 10) {
      status = 'healthy';
    } else if (averageDetectionTime < 1000 && errorRate < 20) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      duplicates,
      pendingWorkflows,
      activeBatchJobs,
      metricsStatus: this.metricsInterval ? 'active' : 'inactive',
      averageDetectionTime,
      errorRate
    };
  }

  // =============================================================================
  // CLEANUP
  // =============================================================================

  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }

    this.removeAllListeners();
    this.duplicates.clear();
    this.matchingRules.clear();
    this.deduplicationStrategies.clear();
    this.workflows.clear();
    this.batchJobs.clear();
  }

  // =============================================================================
  // INITIALIZATION AND MOCK DATA
  // =============================================================================

  private initializeMatchingRules(): void {
    // Contact matching rules
    const contactRule: MatchingRule = {
      id: 'contact_standard',
      name: 'Standard Contact Matching',
      recordType: 'contact',
      isActive: true,
      fields: [
        {
          fieldName: 'email',
          dataType: 'email',
          weight: 40,
          algorithms: ['exact', 'email'],
          normalizeBeforeMatch: true,
          caseSensitive: false,
          ignoreSpecialChars: false,
          minimumSimilarity: 0.9
        },
        {
          fieldName: 'firstName',
          dataType: 'string',
          weight: 20,
          algorithms: ['exact', 'levenshtein', 'jaro_winkler', 'soundex'],
          normalizeBeforeMatch: true,
          caseSensitive: false,
          ignoreSpecialChars: true,
          minimumSimilarity: 0.8
        },
        {
          fieldName: 'lastName',
          dataType: 'string',
          weight: 25,
          algorithms: ['exact', 'levenshtein', 'jaro_winkler', 'soundex'],
          normalizeBeforeMatch: true,
          caseSensitive: false,
          ignoreSpecialChars: true,
          minimumSimilarity: 0.8
        },
        {
          fieldName: 'phone',
          dataType: 'phone',
          weight: 15,
          algorithms: ['exact', 'phone'],
          normalizeBeforeMatch: true,
          caseSensitive: false,
          ignoreSpecialChars: true,
          minimumSimilarity: 0.9
        }
      ],
      thresholds: {
        autoMerge: 90,
        humanReview: 70,
        ignore: 50
      },
      algorithms: [
        {
          name: 'exact',
          type: 'exact',
          parameters: {},
          applicableDataTypes: ['string', 'email', 'phone', 'number'],
          isDefault: true
        },
        {
          name: 'levenshtein',
          type: 'fuzzy',
          parameters: { maxDistance: 3 },
          applicableDataTypes: ['string'],
          isDefault: false
        },
        {
          name: 'jaro_winkler',
          type: 'fuzzy',
          parameters: { threshold: 0.7 },
          applicableDataTypes: ['string'],
          isDefault: false
        }
      ],
      excludeRules: [
        {
          id: 'exclude_test_contacts',
          fieldName: 'email',
          condition: 'contains',
          value: 'test@',
          description: 'Exclude test contacts',
          isActive: true
        }
      ],
      metadata: {
        description: 'Standard matching rules for contact records',
        version: '1.0',
        lastTuned: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.matchingRules.set(contactRule.id, contactRule);

    // Lead matching rules
    const leadRule: MatchingRule = {
      ...contactRule,
      id: 'lead_standard',
      name: 'Standard Lead Matching',
      recordType: 'lead',
      thresholds: {
        autoMerge: 85, // Slightly lower threshold for leads
        humanReview: 65,
        ignore: 45
      }
    };

    this.matchingRules.set(leadRule.id, leadRule);
  }

  private initializeDeduplicationStrategies(): void {
    // Contact deduplication strategy
    const contactStrategy: DeduplicationStrategy = {
      id: 'contact_merge_strategy',
      name: 'Standard Contact Merge',
      recordType: 'contact',
      mergeRules: [
        {
          fieldName: 'email',
          strategy: 'keep_source',
          priority: 1
        },
        {
          fieldName: 'firstName',
          strategy: 'longest',
          priority: 2
        },
        {
          fieldName: 'lastName',
          strategy: 'longest',
          priority: 3
        },
        {
          fieldName: 'phone',
          strategy: 'newest',
          priority: 4
        },
        {
          fieldName: 'company',
          strategy: 'merge',
          priority: 5
        }
      ],
      conflictResolution: [
        {
          fieldName: 'email',
          resolutionType: 'manual',
          requiresApproval: true
        },
        {
          fieldName: 'phone',
          resolutionType: 'automatic',
          automaticRule: 'most_recent',
          requiresApproval: false
        }
      ],
      preserveAuditTrail: true,
      backupBeforeMerge: true,
      isDefault: true
    };

    this.deduplicationStrategies.set(contactStrategy.id, contactStrategy);
  }

  generateMockData(): void {
    // Generate mock duplicate records
    const mockDuplicates: DuplicateRecord[] = [
      {
        id: 'dup_001',
        sourceRecordId: 'contact_123',
        duplicateRecordId: 'contact_456',
        recordType: 'contact',
        sourceSystem: 'salesforce',
        duplicateSystem: 'hubspot',
        confidenceScore: 92,
        matchedFields: [
          {
            fieldName: 'email',
            sourceValue: 'john.doe@company.com',
            duplicateValue: 'john.doe@company.com',
            similarity: 1.0,
            algorithm: 'exact',
            weight: 40,
            isExactMatch: true
          },
          {
            fieldName: 'lastName',
            sourceValue: 'Doe',
            duplicateValue: 'Doe',
            similarity: 1.0,
            algorithm: 'exact',
            weight: 25,
            isExactMatch: true
          }
        ],
        detectionMethod: 'hybrid',
        status: 'pending',
        metadata: {
          detectionTime: 150,
          ruleId: 'contact_standard',
          confidence: 'very_high',
          recommendation: 'auto_merge'
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'dup_002',
        sourceRecordId: 'lead_789',
        duplicateRecordId: 'lead_012',
        recordType: 'lead',
        sourceSystem: 'pipedrive',
        duplicateSystem: 'salesforce',
        confidenceScore: 78,
        matchedFields: [
          {
            fieldName: 'firstName',
            sourceValue: 'Jane',
            duplicateValue: 'Jane',
            similarity: 1.0,
            algorithm: 'exact',
            weight: 20,
            isExactMatch: true
          },
          {
            fieldName: 'lastName',
            sourceValue: 'Smith',
            duplicateValue: 'Smyth',
            similarity: 0.8,
            algorithm: 'jaro_winkler',
            weight: 25,
            isExactMatch: false
          }
        ],
        detectionMethod: 'fuzzy',
        status: 'pending',
        metadata: {
          detectionTime: 220,
          ruleId: 'lead_standard',
          confidence: 'high',
          recommendation: 'review'
        },
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      }
    ];

    mockDuplicates.forEach(duplicate => {
      this.duplicates.set(duplicate.id, duplicate);
    });

    // Generate mock workflows
    const mockWorkflow: ResolutionWorkflow = {
      id: 'workflow_001',
      duplicateId: 'dup_002',
      workflowType: 'manual',
      steps: [
        {
          id: 'step_001',
          stepNumber: 1,
          type: 'validation',
          description: 'Validate duplicate detection accuracy',
          status: 'completed',
          completedBy: 'admin@company.com',
          completedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          result: { validated: true, notes: 'Confirmed duplicate' }
        },
        {
          id: 'step_002',
          stepNumber: 2,
          type: 'approval',
          description: 'Approve merge operation',
          status: 'pending',
          assignedTo: 'manager@company.com'
        }
      ],
      currentStep: 1,
      status: 'in_progress',
      assignedTo: 'manager@company.com',
      priority: 'medium',
      metadata: {
        createdFor: 'lead',
        confidenceScore: 78
      },
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      updatedAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    };

    this.workflows.set(mockWorkflow.id, mockWorkflow);
  }
}

export default DuplicateDetectionService;
