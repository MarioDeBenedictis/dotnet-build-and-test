// index.ts
import * as core from '@actions/core'
import * as exec from '@actions/exec'

/**
 * Executes the GitHub Action workflow defined in index.ts.
 */
export async function run(): Promise<void> {
  try {
    core.info(
      `[START] GitHub Action execution started at ${new Date().toISOString()}`
    )

    // Retrieve inputs with default values
    const testFolder: string = core.getInput('testFolder') || './tests'
    const migrationsFolder: string =
      core.getInput('migrationsFolder') || testFolder
    const envName: string = core.getInput('envName') || 'Test'
    const skipMigrations: boolean = core.getInput('skipMigrations') === 'true'
    const testFormat: string = core.getInput('testFormat') || 'html'
    const useGlobalDotnetEf: boolean =
      core.getInput('useGlobalDotnetEf') === 'true'

    core.info(`[INFO] Loaded Inputs:
  - Test Folder: ${testFolder}
  - Migrations Folder: ${migrationsFolder}
  - Environment: ${envName}
  - Skip Migrations: ${skipMigrations}
  - Test Format: ${testFormat}
  - Use Global dotnet-ef: ${useGlobalDotnetEf}`)

    // Determine which command to use for EF commands
    const efCmd = useGlobalDotnetEf ? 'dotnet-ef' : 'dotnet'
    const efArgsPrefix = useGlobalDotnetEf ? [] : ['ef']

    if (!skipMigrations) {
      core.info('[STEP] Checking pending migrations...')
      let migrationOutput = ''
      const pendingOptions: exec.ExecOptions = {
        listeners: {
          stdout: (data: Buffer) => {
            migrationOutput += data.toString()
          }
        }
      }

      // Run the migration list command
      await exec.exec(
        efCmd,
        [...efArgsPrefix, 'migrations', 'list'],
        pendingOptions
      )

      // Split and trim migration lines
      const migrationLines = migrationOutput
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line !== '')

      // Check for pending migrations (any without "[applied]")
      const pending = migrationLines.some((line) => !line.includes('[applied]'))

      if (!pending) {
        core.info('[STATUS] No pending migrations.')
      } else {
        core.info('[STEP] Applying migrations...')
        await exec.exec(efCmd, [...efArgsPrefix, 'database', 'update'], {
          env: { ...process.env, ASPNETCORE_ENVIRONMENT: envName }
        })
        core.info('[STATUS] Migrations applied.')
      }
    }

    // Run tests with a logger argument
    core.info(`[STEP] Running tests in ${testFolder}...`)
    const testArgs = [
      'test',
      testFolder,
      '--verbosity',
      'detailed',
      '--logger',
      `${testFormat};LogFileName=test-results.${testFormat}`
    ]
    await exec.exec('dotnet', testArgs)
    core.info(`[SUCCESS] All tests passed successfully.`)
  } catch (error) {
    core.error('[ERROR] An error occurred during execution.')
    if (error instanceof Error) {
      core.error(`[ERROR DETAILS] ${error.message}`)
      core.setFailed(`Action failed: ${error.message}`)
    } else {
      core.setFailed(`Action failed: ${error}`)
    }
  }
}

// Run the action if this module is executed directly.
if (require.main === module) {
  run()
}
