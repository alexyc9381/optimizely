/**
 * @jest-environment jsdom
 */
import { TechnologyDetector } from '../modules/TechnologyDetector';

// Simple mock for isBrowser utility
jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  isBrowser: () => true,
}));

describe('TechnologyDetector', () => {
  let detector: TechnologyDetector;

  beforeEach(() => {
    detector = new TechnologyDetector();
  });

  describe('initialization', () => {
    it('should initialize with correct name', () => {
      expect(detector.name).toBe('TechnologyDetector');
    });

    it('should initialize and enable detection', () => {
      detector.init();
      expect(detector.getCurrentTechStack()).toBeDefined();
    });
  });

  describe('basic functionality', () => {
    it('should return empty tech stack when disabled', () => {
      detector.init();
      detector.disable();

      const techStack = detector.getCurrentTechStack();
      expect(techStack).toEqual({
        analytics: [],
        libraries: [],
      });
    });

    it('should allow re-detection', () => {
      detector.init();
      const techStack1 = detector.getCurrentTechStack();
      const techStack2 = detector.redetect();

      expect(techStack1).toBeDefined();
      expect(techStack2).toBeDefined();
    });

    it('should clean up on destroy', () => {
      detector.init();
      detector.destroy();

      const techStack = detector.getCurrentTechStack();
      expect(techStack).toEqual({});
    });
  });
});
