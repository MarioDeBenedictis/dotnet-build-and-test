import { jest } from '@jest/globals'

export const verifyDotnetSDK =
  jest.fn<typeof import('../src/others/dotnet.js').verifyDotnetSDK>()
export const restoreDependencies =
  jest.fn<typeof import('../src/others/dotnet.js').restoreDependencies>()
