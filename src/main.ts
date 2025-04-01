import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { wait } from './wait.js'

export async function run(): Promise<void> {
  core.info(
    `[START] GitHub Action execution started at ${new Date().toISOString()}`
  )

  try {
    // Retrieve GitHub Action Inputs
    const ms: string = core.getInput('milliseconds') || '1000'
    const testFolder = core.getInput('testFolder') || './tests'
    const envName = core.getInput('envName') || 'Test'
    const skipMigrations = core.getInput('skipMigrations') === 'true'
    const useGlobalDotnetEf = core.getInput('useGlobalDotnetEf') === 'true'

    core.info(`[INFO] Loaded Inputs:
      - Wait Time: ${ms}ms
      - Test Folder: ${testFolder}
      - Environment: ${envName}
      - Skip Migrations: ${skipMigrations}
      - Use Global dotnet-ef: ${useGlobalDotnetEf}`)

    core.info(`[STEP] Cleaning up the workspace...`)
    await exec.exec('git', ['restore', '.'])
    core.info('[STATUS] Workspace restored.')

    core.info(`[STEP] Checking .NET SDK version...`)
    await exec.exec('dotnet', ['--version'])
    core.info('[STATUS] .NET SDK verified.')

    core.info(`[STEP] Restoring dependencies...`)
    await exec.exec('dotnet', ['restore'])
    core.info('[STATUS] Dependencies restored.')

    if (!skipMigrations) {
      core.info(`[STEP] Checking pending migrations...`)
      let pendingMigrations = ''
      const migrationOptions: exec.ExecOptions = {
        listeners: {
          stdout: (data: Buffer) => {
            pendingMigrations += data.toString()
          }
        }
      }
      await exec.exec('dotnet', ['ef', 'migrations', 'list'], migrationOptions)

      if (pendingMigrations.includes('[applied]')) {
        core.info('[STATUS] No new migrations detected.')
      } else {
        core.info('[STEP] Applying migrations...')
        await exec.exec('dotnet', ['ef', 'database', 'update'], {
          env: { ASPNETCORE_ENVIRONMENT: envName }
        })
        core.info('[STATUS] Migrations applied.')
      }
    }

    core.info(`[STEP] Running Tests in ${testFolder}...`)
    await exec.exec('dotnet', ['test', testFolder, '--verbosity', 'detailed'])
    core.info('[STATUS] Tests completed successfully.')

    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

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

if (require.main === module) {
  run()
}
