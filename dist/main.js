import * as core from '@actions/core';
import { getInputs } from './inputs';
import { restoreWorkspace } from './workspace';
import { verifyDotnetSDK, restoreDependencies } from './dotnet';
import { processMigrations } from './migrations';
import { runTests } from './tests';
export async function run() {
    core.info(`[START] GitHub Action execution started at ${new Date().toISOString()}`);
    try {
        // Retrieve inputs.
        const { testFolder, envName, skipMigrations, useGlobalDotnetEf } = getInputs();
        // Restore workspace.
        await restoreWorkspace();
        // Verify .NET SDK and restore dependencies.
        await verifyDotnetSDK();
        await restoreDependencies();
        // Process migrations if not skipped.
        if (!skipMigrations) {
            await processMigrations(envName, useGlobalDotnetEf);
        }
        else {
            core.info('Skipping migrations as requested.');
        }
        // Run tests.
        await runTests(testFolder);
        // Set an output (for example, the time when execution finished).
        core.setOutput('time', new Date().toTimeString());
        core.info('GitHub Action completed successfully.');
    }
    catch (error) {
        core.error('An error occurred during execution.');
        if (error instanceof Error) {
            core.error(`Error: ${error.message}`);
            core.setFailed(error.message);
        }
    }
}
// Directly invoke run() if this module is executed directly.
// if (require.main === module) {
//   run()
// }
