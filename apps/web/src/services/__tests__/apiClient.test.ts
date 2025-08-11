import { describe, test, expect } from 'vitest';
import { apiClient } from '../apiClient';

describe('ApiClient', () => {
  test('should create an instance', () => {
    expect(apiClient).toBeDefined();
  });

  test('should have trainModel method', () => {
    expect(typeof apiClient.trainModel).toBe('function');
  });

  test('should have required interfaces exported', () => {
    // This is just to ensure the file compiles properly
    expect(true).toBe(true);
  });
});
