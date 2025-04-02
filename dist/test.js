import * as core from '@actions/core';
import * as exec from '@actions/exec';
export async function runTests(testFolder) {
    core.info(`Running tests in ${testFolder}...`);
    await exec.exec('bash', ['pwd']);
    await exec.exec('dotnet', ['test', testFolder, '--verbosity', 'detailed']);
    core.info('Tests completed successfully.');
}
