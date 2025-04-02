import * as core from '@actions/core';
import * as exec from '@actions/exec';
export async function verifyDotnetSDK() {
    core.info('Verifying .NET SDK version...');
    await exec.getExecOutput('dotnet', ['--version']);
    core.info('.NET SDK verified.');
}
export async function restoreDependencies() {
    core.info('Restoring dependencies...');
    await exec.getExecOutput('dotnet', ['restore']);
    core.info('Dependencies restored.');
}
