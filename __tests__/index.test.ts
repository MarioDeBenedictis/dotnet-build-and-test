import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { run } from '../src/index'

// Mock the '@actions/core' and '@actions/exec' modules
jest.mock('@actions/core')
jest.mock('@actions/exec')

describe('GitHub Action run function', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should execute successfully when there are no pending migrations and tests pass', async () => {
    // Setup input mocks
    ;(core.getInput as jest.Mock)
      .mockImplementation((name: string) => {
        const inputs: { [key: string]: string } = {
          customDotnetArgs: '',
          testFolder: 'tests',
          migrationsFolder: 'migrations',
          envName: 'Test',
          skipMigrations: 'false',
          useGlobalDotnetEf: 'false',
          recreateDatabase: 'false',
          resetGitStrategy: 'soft',
          seedDataScript: '',
          testFormat: 'html',
          parallelTests: 'false',
          testTimeout: '60'
        }
        return inputs[name] || ''
      })(
        // Simulate exec.exec behavior for various commands
        exec.exec as jest.Mock
      )
      .mockImplementation(
        (command: string, args: string[], options?: exec.ExecOptions) => {
          // Simulate applied migrations
          if (
            command === 'dotnet' &&
            args[0] === 'ef' &&
            args[1] === 'migrations' &&
            args[2] === 'list' &&
            args[3] === '--applied'
          ) {
            if (options && options.listeners && options.listeners.stdout) {
              options.listeners.stdout(Buffer.from('Migration1\nMigration2\n'))
            }
            return Promise.resolve(0)
          }

          // Simulate migrations list without applied markers
          if (
            command === 'dotnet' &&
            args[0] === 'ef' &&
            args[1] === 'migrations' &&
            args[2] === 'list'
          ) {
            if (options && options.listeners && options.listeners.stdout) {
              // Mark all migrations as applied
              options.listeners.stdout(
                Buffer.from('Migration1 [applied]\nMigration2 [applied]\n')
              )
            }
            return Promise.resolve(0)
          }

          // Return success for all other commands
          return Promise.resolve(0)
        }
      )

    // Run the action
    await run()

    // Verify that the last applied migration output is set correctly
    expect(core.setOutput).toHaveBeenCalledWith('lastMigration', 'Migration2')
    // Check that info was logged for last migration
    expect(core.info).toHaveBeenCalledWith('Last Applied Migration: Migration2')
  })

  it('should attempt rollback when tests fail and migrations are not skipped', async () => {
    ;(core.getInput as jest.Mock)
      .mockImplementation((name: string) => {
        const inputs: { [key: string]: string } = {
          customDotnetArgs: '',
          testFolder: 'tests',
          migrationsFolder: 'migrations',
          envName: 'Test',
          skipMigrations: 'false',
          useGlobalDotnetEf: 'false',
          recreateDatabase: 'false',
          resetGitStrategy: 'soft',
          seedDataScript: '',
          testFormat: 'html',
          parallelTests: 'false',
          testTimeout: '60'
        }
        return inputs[name] || ''
      })(
        // Simulate exec.exec behavior
        exec.exec as jest.Mock
      )
      .mockImplementation(
        (command: string, args: string[], options?: exec.ExecOptions) => {
          // Simulate applied migrations
          if (
            command === 'dotnet' &&
            args[0] === 'ef' &&
            args[1] === 'migrations' &&
            args[2] === 'list' &&
            args[3] === '--applied'
          ) {
            if (options && options.listeners && options.listeners.stdout) {
              options.listeners.stdout(Buffer.from('Migration1\nMigration2\n'))
            }
            return Promise.resolve(0)
          }
          // Simulate migrations list without applied markers
          if (
            command === 'dotnet' &&
            args[0] === 'ef' &&
            args[1] === 'migrations' &&
            args[2] === 'list'
          ) {
            if (options && options.listeners && options.listeners.stdout) {
              options.listeners.stdout(
                Buffer.from('Migration1 [applied]\nMigration2 [applied]\n')
              )
            }
            return Promise.resolve(0)
          }
          // Simulate a failure when running tests to trigger rollback
          if (command === 'dotnet' && args[0] === 'test') {
            return Promise.reject(new Error('Test failure'))
          }
          // Otherwise, return success
          return Promise.resolve(0)
        }
      )

    // Expect run() to throw because of test failure
    await expect(run()).rejects.toThrow('Test failure')

    // Verify that rollback was attempted with the last applied migration
    expect(exec.exec).toHaveBeenCalledWith(
      'dotnet',
      ['ef', 'database', 'update', 'Migration2'],
      expect.objectContaining({
        cwd: 'migrations',
        env: expect.objectContaining({ ASPNETCORE_ENVIRONMENT: 'Test' })
      })
    )
  })
})
