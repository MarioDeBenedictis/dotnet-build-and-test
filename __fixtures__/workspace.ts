import { jest } from '@jest/globals'

export const restoreWorkspace =
  jest.fn<typeof import('../src/others/workspace.js').restoreWorkspace>()
