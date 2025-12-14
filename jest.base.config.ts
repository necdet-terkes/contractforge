import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts', '**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          sourceMap: true,
          esModuleInterop: true,
          types: ['node', 'jest'],
        },
      },
    ],
  },
  roots: ['.'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  passWithNoTests: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__pact__/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json', 'json-summary'],
  // Coverage thresholds set to current baseline (~30%)
  // These will be gradually increased as coverage improves
  // Current goal: maintain minimum coverage, target: 70%+
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 40,
      lines: 25,
      statements: 25,
    },
  },
};

export default config;
