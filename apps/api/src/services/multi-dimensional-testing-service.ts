import { EventEmitter } from 'events';
import { ABTest } from './autonomous-ab-test-service';

// Core interfaces for multi-dimensional testing
export interface TestSlot {
  id: string;
  name: string;
  priority: number;
  allocatedTraffic: number;
  activeTest?: ABTest;
  status: 'available' | 'occupied' | 'reserved' | 'blocked';
  constraints: SlotConstraints;
  createdAt: Date;
  lastUsed?: Date;
}

export interface SlotConstraints {
  maxDuration: number; // milliseconds
  minTrafficPercent: number;
  maxTrafficPercent: number;
  allowedSegments: string[];
  blockedElements: string[];
  exclusionRules: ExclusionRule[];
}

export interface ExclusionRule {
  type: 'element' | 'segment' | 'traffic' | 'timing';
  condition: string;
  value: any;
  reason: string;
}

export interface TrafficAllocation {
  segment: string;
  percentage: number;
  testSlots: string[];
  overlaps: SegmentOverlap[];
}

export interface SegmentOverlap {
  withSlot: string;
  overlapPercentage: number;
  mitigationStrategy: 'isolate' | 'stratify' | 'exclude' | 'adjust';
}

export interface TestSchedule {
  testId: string;
  _slotId: string;
  startTime: Date;
  endTime: Date;
  priority: number;
  dependencies: string[];
  autoStart: boolean;
}

export interface MultiTestAnalytics {
  totalTests: number;
  activeTests: number;
  trafficUtilization: number;
  segmentCoverage: { [segment: string]: number };
  crossTestEffects: CrossTestEffect[];
  performanceMetrics: OverallPerformanceMetrics;
  resourceUsage: ResourceUsage;
}

export interface CrossTestEffect {
  primaryTest: string;
  affectedTest: string;
  effectMagnitude: number;
  statistical_significance: number;
  mitigationApplied: boolean;
}

export interface OverallPerformanceMetrics {
  averageConversionLift: number;
  cumulativeRevenue: number;
  testSuccessRate: number;
  averageTestDuration: number;
  significanceAchievementRate: number;
}

export interface ResourceUsage {
  cpuUtilization: number;
  memoryUsage: number;
  networkBandwidth: number;
  databaseConnections: number;
}

export interface TestingConfiguration {
  maxSimultaneousTests: number;
  defaultTrafficAllocation: number;
  minimumSegmentSize: number;
  crossTestIsolationLevel: 'strict' | 'moderate' | 'relaxed';
  autoScalingEnabled: boolean;
  performanceThresholds: {
    maxResponseTime: number;
    maxMemoryUsage: number;
    maxErrorRate: number;
  };
}

export default class MultiDimensionalTestingService extends EventEmitter {
  private testSlots: Map<string, TestSlot> = new Map();
  private activeTests: Map<string, ABTest> = new Map();
  private testSchedule: TestSchedule[] = [];
  private trafficAllocations: Map<string, TrafficAllocation> = new Map();
  private configuration: TestingConfiguration;
  private analytics: MultiTestAnalytics;
  private monitoringInterval?: any;
  private isInitialized: boolean = false;

  constructor(config?: Partial<TestingConfiguration>) {
    super();

    this.configuration = {
      maxSimultaneousTests: 25,
      defaultTrafficAllocation: 4, // 4% per test slot by default
      minimumSegmentSize: 1000,
      crossTestIsolationLevel: 'moderate',
      autoScalingEnabled: true,
      performanceThresholds: {
        maxResponseTime: 500,
        maxMemoryUsage: 80,
        maxErrorRate: 0.01
      },
      ...config
    };

    this.analytics = this.initializeAnalytics();
    this.initializeTestSlots();
    this.startMonitoring();
  }

  /**
   * Initialize the testing framework with default slot configuration
   */
  private initializeTestSlots(): void {
    const slotsToCreate = this.configuration.maxSimultaneousTests;

    for (let i = 1; i <= slotsToCreate; i++) {
      const _slotId = `slot_${i.toString().padStart(2, '0')}`;
      const priority = i <= 5 ? 'high' : i <= 15 ? 'medium' : 'low';

      const slot: TestSlot = {
        id: _slotId,
        name: `Test Slot ${i}`,
        priority: this.getPriorityValue(priority),
        allocatedTraffic: this.configuration.defaultTrafficAllocation,
        status: 'available',
        constraints: {
          maxDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
          minTrafficPercent: 2,
          maxTrafficPercent: 10,
          allowedSegments: ['all'],
          blockedElements: [],
          exclusionRules: []
        },
        createdAt: new Date()
      };

      this.testSlots.set(_slotId, slot);
    }

    this.isInitialized = true;
    this.emit('framework_initialized', {
      totalSlots: slotsToCreate,
      configuration: this.configuration
    });
  }

  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'high': return 1;
      case 'medium': return 2;
      case 'low': return 3;
      default: return 2;
    }
  }

  /**
   * Deploy a test to an available slot with automatic optimization
   */
  async deployTest(test: ABTest, preferredSlot?: string): Promise<{
    success: boolean;
    _slotId?: string;
    trafficAllocation?: TrafficAllocation;
    warnings?: string[];
    conflicts?: string[];
  }> {
    try {
      // Find optimal slot for the test
      const optimalSlot = await this.findOptimalSlot(test, preferredSlot);

      if (!optimalSlot) {
        return {
          success: false,
          warnings: ['No available slots found for test deployment'],
          conflicts: ['All slots occupied or blocked by constraints']
        };
      }

      // Check for cross-test contamination
      const contaminationAnalysis = await this.analyzeContamination(test, optimalSlot.id);

      // Allocate traffic for the test
      const trafficAllocation = await this.allocateTraffic(test, optimalSlot.id);

      // Update slot status
      optimalSlot.status = 'occupied';
      optimalSlot.activeTest = test;
      optimalSlot.lastUsed = new Date();

      // Add to active tests
      this.activeTests.set(test.id, test);

      // Store traffic allocation
      this.trafficAllocations.set(test.id, trafficAllocation);

      // Update analytics
      this.updateAnalytics();

      this.emit('test_deployed', {
        testId: test.id,
        _slotId: optimalSlot.id,
        trafficAllocation,
        contaminationRisk: contaminationAnalysis.riskLevel
      });

      return {
        success: true,
        _slotId: optimalSlot.id,
        trafficAllocation,
        warnings: contaminationAnalysis.warnings,
        conflicts: contaminationAnalysis.conflicts
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('deployment_error', { testId: test.id, error: errorMessage });
      throw error;
    }
  }

  /**
   * Find the optimal slot for a test based on constraints and availability
   */
  private async findOptimalSlot(test: ABTest, preferredSlot?: string): Promise<TestSlot | null> {
    // Check preferred slot first
    if (preferredSlot && this.testSlots.has(preferredSlot)) {
      const slot = this.testSlots.get(preferredSlot)!;
      if (await this.isSlotCompatible(slot, test)) {
        return slot;
      }
    }

    // Find all compatible available slots
    const compatibleSlots: TestSlot[] = [];

    for (const slot of this.testSlots.values()) {
      if (slot.status === 'available' && await this.isSlotCompatible(slot, test)) {
        compatibleSlots.push(slot);
      }
    }

    if (compatibleSlots.length === 0) {
      return null;
    }

    // Sort by priority and last usage
    compatibleSlots.sort((a, b) => {
      // Higher priority first (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      // Least recently used first
      const aLastUsed = a.lastUsed ? a.lastUsed.getTime() : 0;
      const bLastUsed = b.lastUsed ? b.lastUsed.getTime() : 0;
      return aLastUsed - bLastUsed;
    });

    return compatibleSlots[0];
  }

  /**
   * Check if a slot is compatible with a test
   */
  private async isSlotCompatible(slot: TestSlot, test: ABTest): Promise<boolean> {
    // Check traffic requirements
    const requiredTraffic = this.calculateRequiredTraffic(test);
    if (requiredTraffic > slot.constraints.maxTrafficPercent) {
      return false;
    }

    // Check segment compatibility
    const testSegments = this.extractTestSegments(test);
    if (!this.areSegmentsAllowed(testSegments, slot.constraints.allowedSegments)) {
      return false;
    }

    // Check element conflicts
    const testElements = this.extractTestElements(test);
    if (this.hasElementConflicts(testElements, slot.constraints.blockedElements)) {
      return false;
    }

    // Check exclusion rules
    if (await this.violatesExclusionRules(test, slot.constraints.exclusionRules)) {
      return false;
    }

    return true;
  }

  /**
   * Analyze potential cross-test contamination
   */
  private async analyzeContamination(test: ABTest, _slotId: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    warnings: string[];
    conflicts: string[];
  }> {
    const warnings: string[] = [];
    const conflicts: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    const testElements = this.extractTestElements(test);
    const testSegments = this.extractTestSegments(test);

    // Check against all active tests
    for (const [activeTestId, activeTest] of this.activeTests) {
      const activeElements = this.extractTestElements(activeTest);
      const activeSegments = this.extractTestSegments(activeTest);

      // Element overlap check
      const elementOverlap = this.calculateElementOverlap(testElements, activeElements);
      if (elementOverlap > 0.3) {
        conflicts.push(`High element overlap (${Math.round(elementOverlap * 100)}%) with test ${activeTestId}`);
        riskLevel = 'high';
      } else if (elementOverlap > 0.1) {
        warnings.push(`Moderate element overlap (${Math.round(elementOverlap * 100)}%) with test ${activeTestId}`);
        if (riskLevel === 'low') riskLevel = 'medium';
      }

      // Segment overlap check
      const segmentOverlap = this.calculateSegmentOverlap(testSegments, activeSegments);
      if (segmentOverlap > 0.7) {
        conflicts.push(`High segment overlap (${Math.round(segmentOverlap * 100)}%) with test ${activeTestId}`);
        riskLevel = 'high';
      } else if (segmentOverlap > 0.4) {
        warnings.push(`Moderate segment overlap (${Math.round(segmentOverlap * 100)}%) with test ${activeTestId}`);
        if (riskLevel === 'low') riskLevel = 'medium';
      }
    }

    return { riskLevel, warnings, conflicts };
  }

  /**
   * Allocate traffic for a test across segments
   */
  private async allocateTraffic(test: ABTest, _slotId: string): Promise<TrafficAllocation> {
    const testSegments = this.extractTestSegments(test);
    const availableTraffic = await this.getAvailableTraffic(_slotId);

    // Calculate segment-based allocation
    const segmentAllocations: { [segment: string]: number } = {};
    const totalSegments = testSegments.length || 1;
    const trafficPerSegment = availableTraffic / totalSegments;

    for (const segment of testSegments) {
      segmentAllocations[segment] = Math.min(trafficPerSegment, 10); // Max 10% per segment
    }

    // Identify overlaps with other tests
    const overlaps: SegmentOverlap[] = [];
    for (const [otherTestId, allocation] of this.trafficAllocations) {
      if (otherTestId !== test.id) {
        const overlapPercentage = this.calculateTrafficOverlap(segmentAllocations, allocation);
        if (overlapPercentage > 0) {
          overlaps.push({
            withSlot: allocation.testSlots[0] || 'unknown',
            overlapPercentage,
            mitigationStrategy: this.determineMitigationStrategy(overlapPercentage)
          });
        }
      }
    }

    return {
      segment: testSegments[0] || 'general',
      percentage: Object.values(segmentAllocations).reduce((sum, val) => sum + val, 0),
      testSlots: [_slotId],
      overlaps
    };
  }

  /**
   * Remove a test from the framework
   */
  async removeTest(testId: string): Promise<{
    success: boolean;
    releasedSlot?: string;
    reallocatedTraffic?: number;
  }> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        return { success: false };
      }

      // Find and release the slot
      let releasedSlot: string | undefined;
      for (const [_slotId, slot] of this.testSlots) {
        if (slot.activeTest?.id === testId) {
          slot.status = 'available';
          slot.activeTest = undefined;
          releasedSlot = _slotId;
          break;
        }
      }

      // Remove from active tests
      this.activeTests.delete(testId);

      // Remove traffic allocation
      const allocation = this.trafficAllocations.get(testId);
      this.trafficAllocations.delete(testId);

      // Update analytics
      this.updateAnalytics();

      this.emit('test_removed', {
        testId,
        releasedSlot,
        releasedTraffic: allocation?.percentage || 0
      });

      return {
        success: true,
        releasedSlot,
        reallocatedTraffic: allocation?.percentage || 0
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('removal_error', { testId, error: errorMessage });
      throw error;
    }
  }

  /**
   * Get current testing framework status
   */
  getFrameworkStatus(): {
    isActive: boolean;
    totalSlots: number;
    availableSlots: number;
    occupiedSlots: number;
    totalTrafficAllocated: number;
    activeTests: ABTest[];
    analytics: MultiTestAnalytics;
  } {
    const totalSlots = this.testSlots.size;
    const availableSlots = Array.from(this.testSlots.values()).filter(slot => slot.status === 'available').length;
    const occupiedSlots = totalSlots - availableSlots;
    const totalTrafficAllocated = Array.from(this.trafficAllocations.values())
      .reduce((sum, allocation) => sum + allocation.percentage, 0);

    return {
      isActive: this.isInitialized,
      totalSlots,
      availableSlots,
      occupiedSlots,
      totalTrafficAllocated,
      activeTests: Array.from(this.activeTests.values()),
      analytics: this.analytics
    };
  }

  /**
   * Get detailed analytics for all active tests
   */
  getDetailedAnalytics(): MultiTestAnalytics {
    this.updateAnalytics();
    return this.analytics;
  }

  /**
   * Schedule a test for future deployment
   */
  scheduleTest(testId: string, schedule: Omit<TestSchedule, 'testId'>): void {
    const testSchedule: TestSchedule = {
      testId,
      ...schedule
    };

    this.testSchedule.push(testSchedule);
    this.testSchedule.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    this.emit('test_scheduled', { testId, schedule: testSchedule });
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<TestingConfiguration>): void {
    this.configuration = { ...this.configuration, ...newConfig };
    this.emit('configuration_updated', { configuration: this.configuration });
  }

  // Helper methods
  private calculateRequiredTraffic(test: ABTest): number {
    return test.trafficAllocation?.totalPercentage || this.configuration.defaultTrafficAllocation;
  }

  private extractTestSegments(test: ABTest): string[] {
    return test.targetAudience?.segments || ['general'];
  }

  private extractTestElements(test: ABTest): string[] {
    const elements: string[] = [];
    for (const variation of test.variations) {
      for (const element of variation.elements) {
        elements.push(element.selector);
      }
    }
    return elements;
  }

  private areSegmentsAllowed(testSegments: string[], allowedSegments: string[]): boolean {
    if (allowedSegments.includes('all')) return true;
    return testSegments.some(segment => allowedSegments.includes(segment));
  }

  private hasElementConflicts(testElements: string[], blockedElements: string[]): boolean {
    return testElements.some(element => blockedElements.includes(element));
  }

  private async violatesExclusionRules(test: ABTest, rules: ExclusionRule[]): Promise<boolean> {
    for (const rule of rules) {
      if (await this.checkExclusionRule(test, rule)) {
        return true;
      }
    }
    return false;
  }

  private async checkExclusionRule(test: ABTest, rule: ExclusionRule): Promise<boolean> {
    switch (rule.type) {
      case 'element':
        return this.extractTestElements(test).includes(rule.value);
      case 'segment':
        return this.extractTestSegments(test).includes(rule.value);
      case 'traffic':
        return this.calculateRequiredTraffic(test) > rule.value;
      case 'timing':
        // Check if test conflicts with timing constraints
        return false; // Simplified
      default:
        return false;
    }
  }

  private calculateElementOverlap(elements1: string[], elements2: string[]): number {
    const set1 = new Set(elements1);
    const set2 = new Set(elements2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateSegmentOverlap(segments1: string[], segments2: string[]): number {
    const set1 = new Set(segments1);
    const set2 = new Set(segments2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private async getAvailableTraffic(_slotId: string): Promise<number> {
    const slot = this.testSlots.get(_slotId);
    if (!slot) return 0;

    const allocatedTraffic = Array.from(this.trafficAllocations.values())
      .reduce((sum, allocation) => sum + allocation.percentage, 0);

    return Math.max(0, 100 - allocatedTraffic);
  }

  private calculateTrafficOverlap(allocation1: { [segment: string]: number }, allocation2: TrafficAllocation): number {
    // Simplified overlap calculation
    return Math.min(
      Object.values(allocation1).reduce((sum, val) => sum + val, 0),
      allocation2.percentage
    ) * 0.1; // Assume 10% overlap for simplicity
  }

  private determineMitigationStrategy(overlapPercentage: number): 'isolate' | 'stratify' | 'exclude' | 'adjust' {
    if (overlapPercentage > 0.5) return 'exclude';
    if (overlapPercentage > 0.3) return 'isolate';
    if (overlapPercentage > 0.1) return 'stratify';
    return 'adjust';
  }

  private initializeAnalytics(): MultiTestAnalytics {
    return {
      totalTests: 0,
      activeTests: 0,
      trafficUtilization: 0,
      segmentCoverage: {},
      crossTestEffects: [],
      performanceMetrics: {
        averageConversionLift: 0,
        cumulativeRevenue: 0,
        testSuccessRate: 0,
        averageTestDuration: 0,
        significanceAchievementRate: 0
      },
      resourceUsage: {
        cpuUtilization: 0,
        memoryUsage: 0,
        networkBandwidth: 0,
        databaseConnections: 0
      }
    };
  }

  private updateAnalytics(): void {
    const activeTestCount = this.activeTests.size;
    const totalTrafficAllocated = Array.from(this.trafficAllocations.values())
      .reduce((sum, allocation) => sum + allocation.percentage, 0);

    this.analytics = {
      ...this.analytics,
      totalTests: this.testSlots.size,
      activeTests: activeTestCount,
      trafficUtilization: totalTrafficAllocated,
      segmentCoverage: this.calculateSegmentCoverage(),
      crossTestEffects: this.calculateCrossTestEffects(),
      performanceMetrics: this.calculatePerformanceMetrics(),
      resourceUsage: this.calculateResourceUsage()
    };
  }

  private calculateSegmentCoverage(): { [segment: string]: number } {
    const coverage: { [segment: string]: number } = {};

    for (const allocation of this.trafficAllocations.values()) {
      if (!coverage[allocation.segment]) {
        coverage[allocation.segment] = 0;
      }
      coverage[allocation.segment] += allocation.percentage;
    }

    return coverage;
  }

  private calculateCrossTestEffects(): CrossTestEffect[] {
    const effects: CrossTestEffect[] = [];

    // Simplified cross-test effect calculation
    const activeTestIds = Array.from(this.activeTests.keys());
    for (let i = 0; i < activeTestIds.length; i++) {
      for (let j = i + 1; j < activeTestIds.length; j++) {
        effects.push({
          primaryTest: activeTestIds[i],
          affectedTest: activeTestIds[j],
          effectMagnitude: Math.random() * 0.1, // Simplified
          statistical_significance: Math.random() * 0.05, // Simplified
          mitigationApplied: false
        });
      }
    }

    return effects;
  }

  private calculatePerformanceMetrics(): OverallPerformanceMetrics {
    // Simplified performance metrics calculation
    return {
      averageConversionLift: 0.12, // 12% average lift
      cumulativeRevenue: 50000, // $50k cumulative
      testSuccessRate: 0.68, // 68% success rate
      averageTestDuration: 14 * 24 * 60 * 60 * 1000, // 14 days
      significanceAchievementRate: 0.85 // 85% achieve significance
    };
  }

  private calculateResourceUsage(): ResourceUsage {
    // Simplified resource usage calculation
    const activeTestCount = this.activeTests.size;
    const baselineUsage = 10; // 10% baseline
    const perTestUsage = 2; // 2% per test

    return {
      cpuUtilization: Math.min(100, baselineUsage + (activeTestCount * perTestUsage)),
      memoryUsage: Math.min(100, baselineUsage + (activeTestCount * perTestUsage * 1.5)),
      networkBandwidth: Math.min(100, baselineUsage + (activeTestCount * perTestUsage * 0.8)),
      databaseConnections: activeTestCount * 2 // 2 connections per test
    };
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateAnalytics();
      this.checkPerformanceThresholds();
      this.processScheduledTests();

      this.emit('monitoring_update', {
        timestamp: new Date(),
        analytics: this.analytics,
        status: this.getFrameworkStatus()
      });
    }, 30000); // Every 30 seconds
  }

  private checkPerformanceThresholds(): void {
    const { performanceThresholds } = this.configuration;
    const { resourceUsage } = this.analytics;

    if (resourceUsage.cpuUtilization > performanceThresholds.maxMemoryUsage) {
      this.emit('performance_warning', {
        type: 'high_cpu',
        value: resourceUsage.cpuUtilization,
        threshold: performanceThresholds.maxMemoryUsage
      });
    }

    if (resourceUsage.memoryUsage > performanceThresholds.maxMemoryUsage) {
      this.emit('performance_warning', {
        type: 'high_memory',
        value: resourceUsage.memoryUsage,
        threshold: performanceThresholds.maxMemoryUsage
      });
    }
  }

  private processScheduledTests(): void {
    const now = new Date();
    const readyTests = this.testSchedule.filter(schedule =>
      schedule.startTime <= now && schedule.autoStart
    );

    for (const schedule of readyTests) {
      // Remove from schedule
      this.testSchedule = this.testSchedule.filter(s => s.testId !== schedule.testId);

      this.emit('scheduled_test_ready', {
        testId: schedule.testId,
        _slotId: schedule._slotId
      });
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.testSlots.clear();
    this.activeTests.clear();
    this.trafficAllocations.clear();
    this.testSchedule = [];

    this.emit('framework_destroyed');
  }
}
