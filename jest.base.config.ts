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
};

export default config;
