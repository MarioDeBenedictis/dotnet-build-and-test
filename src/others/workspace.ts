import * as core from '@actions/core'
import * as exec from '@actions/exec'

const getExecOutput: boolean = core.getInput('getExecOutput') == 'true'

export async function restoreWorkspace(): Promise<void> {
  core.info('Restoring workspace...')
  if (!getExecOutput) {
    await exec.getExecOutput('git', ['restore', '.'])
  } else {
    await exec.exec('git', ['restore', '.'])
  }
  core.info('Workspace restored.')
}
