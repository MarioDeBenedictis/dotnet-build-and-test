import * as core from '@actions/core'
import { getInputs } from './inputs.js'
import { processMigrations } from './migrations.js'
import { runTests } from './test.js'

export async function run(): Promise<void> {
  core.setOutput('startTime', new Date().toTimeString())
  core.info(
    `[START] GitHub Action execution started at ${new Date().toISOString()}`
  )

  try {
    const inputs = getInputs()
    // Process migrations if not skipped.
    if (!inputs.skipMigrations) {
      await processMigrations(
        inputs.envName,
        inputs.dotnetRoot,
        inputs.useGlobalDotnetEf,
        inputs.migrationsFolder,
        inputs.getExecOutput
      )
    } else {
      core.info('Skipping migrations as requested.')
    }

    // Run tests if not skipped.
    if (!inputs.skipTests) {
      await runTests(
        inputs.testFolder,
        inputs.getExecOutput,
        inputs.testFormat,
        inputs.parallelTests,
        inputs.testTimeout,
        inputs.customDotnetArgs
      )
    } else {
      core.info('Skipping tests as requested.')
    }

    core.setOutput('endTime', new Date().toTimeString())
    core.info(
      `[END] GitHub Action execution ended at ${new Date().toISOString()}`
    )
    core.info('GitHub Action completed successfully.')
  } catch (error) {
    core.error('An error occurred during execution.')
    if (error instanceof Error) {
      core.error(`Error: ${error.message}`)
      core.setFailed(error.message)
    }
  }
}
