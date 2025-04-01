import * as core from '@actions/core'
import * as exec from '@actions/exec'

export async function run(): Promise<void> {
  let lastMigration = ''
  let appliedMigrations = ''
  let hasPendingMigrations = false
  const startTime = Date.now()

  // Declare variables that need to be used in both try and catch blocks
  let testFolder = ''
  let migrationsFolder = ''
  let envName = 'Test'
  let skipMigrations = false
  let useGlobalDotnetEf = false
  let recreateDatabase = false
  let resetGitStrategy = 'soft'
  let seedDataScript = ''
  let testFormat = 'html'
  let parallelTestExecution = false
  let testTimeout = '60'
  let customDotnetArgs = ''

  try {
    // Cleanup
    core.info('Performing cleanup...')
    await exec.exec('git', ['restore', '.'])

    // Check .NET SDK version
    core.info('Checking .NET SDK version...')
    await exec.exec('dotnet', ['--version'])

    // Restore dependencies
    core.info('Restoring dependencies...')
    await exec.exec('dotnet', ['restore'])

    // Build the project
    core.info('Building the project...')
    customDotnetArgs = core.getInput('customDotnetArgs') || ''
    const buildArgs = ['build', ...customDotnetArgs.split(' ').filter(Boolean)]
    await exec.exec('dotnet', buildArgs)

    // Get inputs for tests and migrations
    testFolder = core.getInput('testFolder')
    migrationsFolder = core.getInput('migrationsFolder') || testFolder
    envName = core.getInput('envName') || 'Test'
    skipMigrations = core.getInput('skipMigrations') === 'true'
    useGlobalDotnetEf = core.getInput('useGlobalDotnetEf') === 'true'
    recreateDatabase = core.getInput('recreateDatabase') === 'true'
    resetGitStrategy = core.getInput('resetGitStrategy') || 'soft'
    seedDataScript = core.getInput('seedDataScript') || ''
    testFormat = core.getInput('testFormat') || 'html'
    parallelTestExecution = core.getInput('parallelTests') === 'true'
    testTimeout = core.getInput('testTimeout') || '60'

    // Log configuration
    core.info(`Environment: ${envName}`)
    core.info(`Test Folder: ${testFolder}`)
    core.info(`Migrations Folder: ${migrationsFolder}`)
    core.info(`Skip Migrations: ${skipMigrations}`)
    core.info(`Use Global dotnet-ef: ${useGlobalDotnetEf}`)
    core.info(`Recreate Database: ${recreateDatabase}`)
    core.info(`Reset Git Strategy: ${resetGitStrategy}`)
    core.info(`Seed Data Script: ${seedDataScript}`)

    // Migration process
    if (!skipMigrations) {
      // Install local dotnet-ef if not using global version
      if (!useGlobalDotnetEf) {
        core.info('Installing local dotnet-ef...')
        await exec.exec('dotnet', ['new', 'tool-manifest', '--force'], {
          cwd: migrationsFolder
        })
        await exec.exec('dotnet', ['tool', 'install', '--local', 'dotnet-ef'], {
          cwd: migrationsFolder
        })
      }

      // Check applied migrations
      core.info('Checking applied migrations...')
      const options: exec.ExecOptions = {
        cwd: migrationsFolder,
        listeners: {
          stdout: (data: Buffer) => {
            appliedMigrations += data.toString()
          }
        }
      }
      await exec.exec(
        'dotnet',
        ['ef', 'migrations', 'list', '--applied'],
        options
      )

      const migrations = appliedMigrations
        .trim()
        .split('\n')
        .filter((line) => line.trim() !== '')
      lastMigration = migrations[migrations.length - 1] || ''
      core.info(`Last Applied Migration: ${lastMigration}`)
      core.setOutput('lastMigration', lastMigration)

      // Check for pending migrations by creating a new options object
      let pendingMigrations = ''
      const pendingOptions: exec.ExecOptions = {
        cwd: migrationsFolder,
        listeners: {
          stdout: (data: Buffer) => {
            pendingMigrations += data.toString()
          }
        }
      }
      await exec.exec('dotnet', ['ef', 'migrations', 'list'], pendingOptions)
      hasPendingMigrations = pendingMigrations
        .trim()
        .split('\n')
        .some((m) => !m.includes('[applied]'))

      if (hasPendingMigrations) {
        core.info('Detected pending migrations, applying...')
        if (recreateDatabase) {
          core.info('Dropping and recreating the database...')
          await exec.exec('dotnet', ['ef', 'database', 'drop', '--force'], {
            cwd: migrationsFolder
          })
        }
        // Update database using applied migrations
        await exec.exec('dotnet', ['ef', 'database', 'update'], {
          cwd: migrationsFolder,
          env: { ...process.env, ASPNETCORE_ENVIRONMENT: envName }
        })

        // Seed the database if a seed script is provided
        if (seedDataScript) {
          core.info(`Seeding database using: ${seedDataScript}`)
          await exec.exec('dotnet', ['run', '--project', seedDataScript], {
            env: { ...process.env, ASPNETCORE_ENVIRONMENT: envName }
          })
        }
      } else {
        core.info('No pending migrations detected.')
      }
    }

    // Run API tests
    core.info('Running API Tests...')
    const testArgs = [
      'test',
      '--logger',
      `${testFormat};LogFileName=integration-test-results.${testFormat}`,
      '--results-directory',
      'TestResults/logs',
      '--blame-crash',
      '--filter',
      'FullyQualifiedName~MyNamespace.Tests',
      '--verbosity',
      'detailed'
    ]
    if (parallelTestExecution) testArgs.push('--parallel')
    if (testTimeout) {
      // Split timeout flag and its value into separate array elements.
      testArgs.push('--timeout', testTimeout)
    }
    await exec.exec('dotnet', testArgs, { cwd: testFolder })

    core.info(
      `All tests passed in ${((Date.now() - startTime) / 1000).toFixed(2)}s.`
    )
  } catch (error) {
    core.error('An error occurred.')
    core.error(`Error Details: ${error}`)

    // Attempt rollback if necessary
    if (!skipMigrations && lastMigration) {
      core.error('Attempting rollback...')
      try {
        await exec.exec('dotnet', ['ef', 'database', 'update', lastMigration], {
          cwd: migrationsFolder,
          env: { ...process.env, ASPNETCORE_ENVIRONMENT: envName }
        })
        core.info('Rollback successful.')
      } catch (rollbackError) {
        core.error(`Rollback failed: ${rollbackError}`)
      }
    }

    // Reset repository based on the git reset strategy
    core.error('Resetting repository...')
    if (resetGitStrategy !== 'none') {
      await exec.exec('git', ['reset', '--' + resetGitStrategy])
    }

    core.setFailed(`Action failed: ${error}`)
    // Propagate the error so tests can catch it
    throw error
  }
}

if (require.main === module) {
  run()
}
