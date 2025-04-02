import * as core from '@actions/core';
import * as exec from '@actions/exec';
export async function restoreWorkspace() {
    core.info('Restoring workspace...');
    await exec.getExecOutput('git', ['restore', '.']);
    core.info('Workspace restored.');
}
