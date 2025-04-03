import { jest } from '@jest/globals'

export const processMigrations =
  jest.fn<typeof import('../src/migrations.js').processMigrations>()
