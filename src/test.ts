import * as core from '@actions/core'
import * as exec from '@actions/exec'

/**
 * Runs tests in the specified test folder.
 *
 * @param testFolder - The folder containing the test project.
 * @param getExecOutput - Flag to determine the method of execution output.
 * @param testFormat - Format for test results (e.g., trx, html, json)
 * @param parallelTests - Whether to run tests in parallel.
 * @param testTimeout - Timeout in seconds for the test execution.
 * @param customDotnetArgs - Additional arguments for dotnet test.
 */
export async function runTests(
  testFolder: string,
  getExecOutput: boolean,
  testFormat: string,
  parallelTests: boolean,
  testTimeout: number,
  customDotnetArgs: string
): Promise<void> {
  core.info(`Running tests in ${testFolder}...`)

  // Build the test command arguments.
  const args = ['test', testFolder, '--verbosity', 'detailed']

  // Optionally add a result logger format.
  if (testFormat) {
    args.push('--logger', `trx;LogFileName=TestResults.${testFormat}`)
  }

  // Add argument for parallel execution if enabled.
  if (parallelTests) {
    args.push('--parallel')
  }

  // Add a timeout argument if provided.
  if (testTimeout > 0) {
    args.push(`--timeout`, testTimeout.toString())
  }

  // Append any custom dotnet arguments.
  if (customDotnetArgs) {
    args.push(...customDotnetArgs.split(' '))
  }

  if (getExecOutput) {
    const result = await exec.getExecOutput('dotnet', args)
    core.info(result.stdout)
  } else {
    await exec.exec('dotnet', args)
  }
  core.info('Tests completed successfully.')
}
