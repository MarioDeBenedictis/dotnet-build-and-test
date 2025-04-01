import * as core from '@actions/core'
import * as exec from '@actions/exec'

export async function run(): Promise<void> {
  const startTime = Date.now()
  core.info(
    `[START] GitHub Action execution started at ${new Date().toISOString()}`
  )

  let lastMigration = ''
  let appliedMigrations = ''
  let hasPendingMigrations = false

  // Variables to store GitHub Action inputs
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
    core.info(`[STEP] Cleaning up the workspace...`)
    await exec.exec('git', ['restore', '.'])
    core.info('[STATUS] Workspace restored.')

    core.info(`[STEP] Checking .NET SDK version...`)
    await exec.exec('dotnet', ['--version'])
    core.info('[STATUS] .NET SDK version verified.')

    core.info(`[STEP] Restoring dependencies...`)
    await exec.exec('dotnet', ['restore'])
    core.info('[STATUS] Dependencies restored.')

    core.info(`[STEP] Building the project...`)
    customDotnetArgs = core.getInput('customDotnetArgs') || ''
    const buildArgs = ['build', ...customDotnetArgs.split(' ').filter(Boolean)]
    await exec.exec('dotnet', buildArgs)
    core.info('[STATUS] Project built successfully.')

    // Retrieve GitHub Action inputs
    core.info(`[STEP] Retrieving GitHub Action Inputs...`)
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

    core.info(`[INFO] Configuration Loaded:
    - Environment: ${envName}
    - Test Folder: ${testFolder}
    - Migrations Folder: ${migrationsFolder}
    - Skip Migrations: ${skipMigrations}
    - Use Global dotnet-ef: ${useGlobalDotnetEf}
    - Recreate Database: ${recreateDatabase}
    - Reset Git Strategy: ${resetGitStrategy}
    - Seed Data Script: ${seedDataScript}`)

    if (!skipMigrations) {
      if (!useGlobalDotnetEf) {
        core.info('[STEP] Installing local dotnet-ef...')
        await exec.exec('dotnet', ['new', 'tool-manifest', '--force'], {
          cwd: migrationsFolder
        })
        await exec.exec('dotnet', ['tool', 'install', '--local', 'dotnet-ef'], {
          cwd: migrationsFolder
        })
        core.info('[STATUS] Local dotnet-ef installed.')
      }

      core.info('[STEP] Checking applied migrations...')
      const appliedOptions: exec.ExecOptions = {
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
        appliedOptions
      )
      const migrations = appliedMigrations
        .trim()
        .split('\n')
        .filter((line) => line.trim() !== '')
      lastMigration =
        migrations.length > 0 ? migrations[migrations.length - 1] : ''
      core.info(`[STATUS] Last applied migration: ${lastMigration}`)
      core.setOutput('lastMigration', lastMigration)

      core.info('[STEP] Checking for pending migrations...')
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
        core.info('[STATUS] Pending migrations detected.')
        if (recreateDatabase) {
          core.info('[STEP] Dropping and recreating database...')
          await exec.exec('dotnet', ['ef', 'database', 'drop', '--force'], {
            cwd: migrationsFolder
          })
          core.info('[STATUS] Database recreated.')
        }
        core.info('[STEP] Applying migrations...')
        await exec.exec('dotnet', ['ef', 'database', 'update'], {
          cwd: migrationsFolder,
          env: { ...process.env, ASPNETCORE_ENVIRONMENT: envName }
        })
        core.info('[STATUS] Migrations applied.')

        if (seedDataScript) {
          core.info(`[STEP] Running seed data script: ${seedDataScript}`)
          await exec.exec('dotnet', ['run', '--project', seedDataScript], {
            env: { ...process.env, ASPNETCORE_ENVIRONMENT: envName }
          })
          core.info('[STATUS] Seed data applied.')
        }
      } else {
        core.info('[STATUS] No pending migrations.')
      }
    }

    core.info('[STEP] Running API tests...')
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
    if (testTimeout) testArgs.push('--timeout', testTimeout)
    await exec.exec('dotnet', testArgs, { cwd: testFolder })
    core.info(
      `[STATUS] All tests passed in ${((Date.now() - startTime) / 1000).toFixed(2)} seconds.`
    )
  } catch (error) {
    core.error('[ERROR] An error occurred.')
    core.error(`[ERROR DETAILS] ${error}`)

    if (!skipMigrations && lastMigration) {
      core.error('[STEP] Attempting rollback...')
      try {
        await exec.exec('dotnet', ['ef', 'database', 'update', lastMigration], {
          cwd: migrationsFolder,
          env: { ...process.env, ASPNETCORE_ENVIRONMENT: envName }
        })
        core.info('[STATUS] Rollback successful.')
      } catch (rollbackError) {
        core.error(`[ERROR] Rollback failed: ${rollbackError}`)
      }
    }

    core.error('[STEP] Resetting repository...')
    if (resetGitStrategy !== 'none') {
      await exec.exec('git', ['reset', '--' + resetGitStrategy])
    }

    core.setFailed(`[FAILED] Action failed: ${error}`)
    throw error
  }
}

if (require.main === module) {
  run()
}
