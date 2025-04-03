import * as core from '@actions/core';
import * as exec from '@actions/exec';
const getExecOutput = core.getInput('getExecOutput') == 'true';
export async function verifyDotnetSDK() {
        core.info('Verifying .NET SDK version...');
        if (!getExecOutput) {
        await exec.exec('dotnet', ['--version']);
        } else {
            await exec.getExecOutput('dotnet', ['--version']);
        }
        core.info('.NET SDK verified.');

}
export async function restoreDependencies() {
        core.info('Restoring dependencies...');
    if (!getExecOutput) {
        await exec.exec('dotnet', ['restore']);
    } else {
        await exec.getExecOutput('dotnet', ['restore']);
    }
        core.info('Dependencies restored.');
    
}
