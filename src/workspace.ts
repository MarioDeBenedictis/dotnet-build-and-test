import * as core from '@actions/core'
import * as exec from '@actions/exec'

export async function restoreWorkspace(): Promise<void> {
  core.info('Restoring workspace...')
  await exec.getExecOutput('git', ['restore', '.'])
  core.info('Workspace restored.')
}
