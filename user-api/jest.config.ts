import baseConfig from '../jest.base.config';
import type { Config } from 'jest';

const config: Config = {
  ...baseConfig,
  displayName: 'user-api',
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.test.ts', '<rootDir>/src/**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
};

export default config;
