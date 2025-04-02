import * as core from '@actions/core'
import * as exec from '@actions/exec'

export async function runTests(testFolder: string): Promise<void> {
  core.info(`Running tests in ${testFolder}...`)
  await exec.getExecOutput('pwd')
  await exec.getExecOutput('dotnet', [
    'test',
    testFolder,
    '--verbosity',
    'detailed'
  ])
  core.info('Tests completed successfully.')
}
