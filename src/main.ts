// main.ts
import * as core from '@actions/core'
import * as exec from '@actions/exec'

/**
 * Executes the GitHub Action workflow defined in main.ts.
 */
export async function run(): Promise<void> {
  core.info(
    `[START] GitHub Action execution started at ${new Date().toISOString()}`
  )

  try {
    // Retrieve GitHub Action Inputs with default values
    const msInput: string = core.getInput('milliseconds') || '1000'
    const testFolder: string = core.getInput('testFolder') || './tests'
    const envName: string = core.getInput('envName') || 'Test'
    const skipMigrations: boolean = core.getInput('skipMigrations') === 'true'
    const useGlobalDotnetEf: boolean =
      core.getInput('useGlobalDotnetEf') === 'true'
    const ms: number = parseInt(msInput, 10)

    core.info(`[INFO] Loaded Inputs:
  - Wait Time: ${ms}ms
  - Test Folder: ${testFolder}
  - Environment: ${envName}
  - Skip Migrations: ${skipMigrations}
  - Use Global dotnet-ef: ${useGlobalDotnetEf}`)

    // Determine which command to use for EF commands
    const efCmd = useGlobalDotnetEf ? 'dotnet-ef' : 'dotnet'
    const efArgsPrefix = useGlobalDotnetEf ? [] : ['ef']

    // Clean up the workspace
    core.info(`[STEP] Cleaning up the workspace...`)
    await exec.exec('git', ['restore', '.'])
    core.info('[STATUS] Workspace restored.')

    // Check .NET SDK version
    core.info(`[STEP] Checking .NET SDK version...`)
    await exec.exec('dotnet', ['--version'])
    core.info('[STATUS] .NET SDK verified.')

    // Restore dependencies
    core.info(`[STEP] Restoring dependencies...`)
    await exec.exec('dotnet', ['restore'])
    core.info('[STATUS] Dependencies restored.')

    if (!skipMigrations) {
      core.info(`[STEP] Checking pending migrations...`)
      let migrationOutput = ''
      const migrationOptions: exec.ExecOptions = {
        listeners: {
          stdout: (data: Buffer) => {
            migrationOutput += data.toString()
          }
        }
      }

      // List migrations using the appropriate command
      await exec.exec(
        efCmd,
        [...efArgsPrefix, 'migrations', 'list'],
        migrationOptions
      )

      // Process the migration list line by line
      const migrationLines = migrationOutput
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line !== '')

      // Determine if any migration does not have the "[applied]" marker
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

    // Run tests
    core.info(`[STEP] Running tests in ${testFolder}...`)
    await exec.exec('dotnet', ['test', testFolder, '--verbosity', 'detailed'])
    core.info('[STATUS] Tests completed successfully.')

    // Set the output for the action
    core.setOutput('time', new Date().toTimeString())
    core.info(`[SUCCESS] GitHub Action completed successfully.`)
  } catch (error) {
    core.error('[ERROR] An unexpected error occurred.')
    if (error instanceof Error) {
      core.error(`[ERROR DETAILS] ${error.message}`)
      core.setFailed(error.message)
    }
  }
}

// Run the action if this module is executed directly.
if (require.main === module) {
  run()
}
