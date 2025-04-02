import * as core from '@actions/core'
import * as exec from '@actions/exec'

export async function verifyDotnetSDK(): Promise<void> {
  core.info('Verifying .NET SDK version...')
  await exec.exec('dotnet', ['--version'])
  core.info('.NET SDK verified.')
}

export async function restoreDependencies(): Promise<void> {
  core.info('Restoring dependencies...')
  await exec.exec('dotnet', ['restore'])
  core.info('Dependencies restored.')
}
