/**
 * Platform Integration Testing Helper
 * Tests universal compatibility across web platforms
 */

export interface TestResult {
  platform: string;
  scenario: string;
  passed: boolean;
  error: string | null;
  duration: number;
  features: string[];
}

export class PlatformIntegrationTester {
  private platforms = new Map<string, any>();

  constructor() {
    this.initializePlatforms();
  }

  private initializePlatforms() {
    this.platforms.set('wordpress', {
      name: 'WordPress',
      globals: { wp: { hooks: { addAction: jest.fn() } }, jQuery: jest.fn() },
      testFeatures: ['pageview tracking', 'admin detection']
    });

    this.platforms.set('react', {
      name: 'React',
      globals: { React: { version: '18.0.0' }, ReactDOM: { version: '18.0.0' } },
      testFeatures: ['route tracking', 'component lifecycle']
    });

    this.platforms.set('shopify', {
      name: 'Shopify',
      globals: { Shopify: { shop: 'test.myshopify.com' } },
      testFeatures: ['product tracking', 'cart events']
    });
  }

  public mockPlatformEnvironment(platformName: string): void {
    const platform = this.platforms.get(platformName);
    if (platform && platform.globals) {
      Object.keys(platform.globals).forEach(key => {
        (global as any)[key] = platform.globals[key];
      });
    }
  }

  public cleanupPlatformEnvironment(): void {
    const allGlobals = ['wp', 'jQuery', 'React', 'ReactDOM', 'Shopify', 'Vue', 'ng'];
    allGlobals.forEach(key => {
      delete (global as any)[key];
    });
  }

  public async runTest(platformName: string, testFn: () => Promise<void>): Promise<TestResult> {
    const startTime = performance.now();
    const result: TestResult = {
      platform: platformName,
      scenario: 'integration-test',
      passed: false,
      error: null,
      duration: 0,
      features: this.platforms.get(platformName)?.testFeatures || []
    };

    try {
      this.mockPlatformEnvironment(platformName);
      await testFn();
      result.passed = true;
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.passed = false;
    } finally {
      result.duration = performance.now() - startTime;
      this.cleanupPlatformEnvironment();
    }

    return result;
  }

  public getSupportedPlatforms(): string[] {
    return Array.from(this.platforms.keys());
  }
}
