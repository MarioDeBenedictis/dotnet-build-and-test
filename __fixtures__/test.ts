import { jest } from '@jest/globals'

export const runTest = jest.fn<typeof import('../src/test.js').runTests>()
