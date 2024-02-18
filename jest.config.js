module.exports = {
    preset: 'ts-jest',
    transform: { '^.+\\.ts?$': 'ts-jest' },
    testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)', '!**/setupTests.ts'],
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: "coverage",
}