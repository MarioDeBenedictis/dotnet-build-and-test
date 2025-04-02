import * as core from '@actions/core'
import * as exec from '@actions/exec'

const getExecOutput: boolean = core.getInput('getExecOutput') == 'true'

export async function runTests(testFolder: string): Promise<void> {
  if (!getExecOutput) {
    core.info(`Running tests in ${testFolder}...`)
    await exec.exec('dotnet', ['test', testFolder, '--verbosity', 'detailed'])
    core.info('Tests completed successfully.')
  } else {
    core.info(`Running tests in ${testFolder}...`)
    await exec.getExecOutput('dotnet', [
      'test',
      testFolder,
      '--verbosity',
      'detailed'
    ])
    core.info('Tests completed successfully.')
  }
}
