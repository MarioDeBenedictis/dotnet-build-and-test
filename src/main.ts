import * as core from '@actions/core'
import * as exec from '@actions/exec'

/**
 * Main function executing the GitHub Action logic.
 */
export async function run(): Promise<void> {
  core.info(
    `[START] GitHub Action execution started at ${new Date().toISOString()}`
  )

  try {
    // Retrieve GitHub Action inputs with default values.
    const testFolder: string = core.getInput('testFolder') || './tests'
    const envName: string = core.getInput('envName') || 'Test'
    const skipMigrations: boolean = core.getInput('skipMigrations') === 'true'
    const useGlobalDotnetEf: boolean =
      core.getInput('useGlobalDotnetEf') === 'true'

    core.info(`Loaded inputs:
  - Test Folder: ${testFolder}
  - Environment: ${envName}
  - Skip Migrations: ${skipMigrations}
  - Use Global dotnet-ef: ${useGlobalDotnetEf}`)

    // Restore workspace.
    core.info('Restoring workspace...')
    await exec.exec('git', ['restore', '.'])
    core.info('Workspace restored.')

    // Verify .NET SDK.
    core.info('Verifying .NET SDK version...')
    await exec.exec('dotnet', ['--version'])
    core.info('.NET SDK verified.')

    // Restore dependencies.
    core.info('Restoring dependencies...')
    await exec.exec('dotnet', ['restore'])
    core.info('Dependencies restored.')

    // Process migrations if not skipped.
    if (!skipMigrations) {
      let migrationOutput = ''
      const migrationOptions: exec.ExecOptions = {
        listeners: {
          stdout: (data: Buffer) => {
            migrationOutput += data.toString()
          }
        }
      }

      // Select the proper command for migrations.
      const efCmd = useGlobalDotnetEf ? 'dotnet-ef' : 'dotnet'
      const efArgs = useGlobalDotnetEf
        ? ['migrations', 'list']
        : ['ef', 'migrations', 'list']
      core.info('Listing migrations...')
      await exec.exec(efCmd, efArgs, migrationOptions)

      // If output does not include the "[applied]" marker, assume pending migrations.
      if (migrationOutput.indexOf('[applied]') === -1) {
        core.info('Pending migrations detected. Applying migrations...')
        const updateArgs = useGlobalDotnetEf
          ? ['database', 'update']
          : ['ef', 'database', 'update']
        await exec.exec(efCmd, updateArgs, {
          env: { ...process.env, ASPNETCORE_ENVIRONMENT: envName }
        })
        core.info('Migrations applied.')
      } else {
        core.info('No pending migrations.')
      }
    } else {
      core.info('Skipping migrations as requested.')
    }

    // Run tests.
    core.info(`Running tests in ${testFolder}...`)
    await exec.exec('dotnet', ['test', testFolder, '--verbosity', 'detailed'])
    core.info('Tests completed successfully.')

    // Set an output (for example, the time when execution finished).
    core.setOutput('time', new Date().toTimeString())
    core.info('GitHub Action completed successfully.')
  } catch (error) {
    core.error('An error occurred during execution.')
    if (error instanceof Error) {
      core.error(`Error: ${error.message}`)
      core.setFailed(error.message)
    }
  }
}
