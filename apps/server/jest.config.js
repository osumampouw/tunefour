/**
 * Jest configuration for the server. Uses ts-jest to run TypeScript unit tests
 * directly. Tests live next to the code they cover as `*.spec.ts`.
 *
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
};
