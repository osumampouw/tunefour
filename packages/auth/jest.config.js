/**
 * Jest configuration for the pure auth package. Uses ts-jest to run the
 * TypeScript unit tests directly (no build step needed for tests).
 *
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
};
