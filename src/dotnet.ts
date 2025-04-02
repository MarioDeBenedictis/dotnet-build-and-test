import * as core from '@actions/core'
import * as exec from '@actions/exec'

const getExecOutput: boolean = core.getInput('getExecOutput') == 'true'

export async function verifyDotnetSDK(): Promise<void> {
  if (!getExecOutput) {
    core.info('Verifying .NET SDK version...')
    await exec.exec('dotnet', ['--version'])
    core.info('.NET SDK verified.')
  } else {
    core.info('Verifying .NET SDK version...')
    await exec.getExecOutput('dotnet', ['--version'])
    core.info('.NET SDK verified.')
  }
}

export async function restoreDependencies(): Promise<void> {
  if (!getExecOutput) {
    core.info('Restoring dependencies...')
    await exec.exec('dotnet', ['restore'])
    core.info('Dependencies restored.')
  } else {
    core.info('Restoring dependencies...')
    await exec.getExecOutput('dotnet', ['restore'])
    core.info('Dependencies restored.')
  }
}
