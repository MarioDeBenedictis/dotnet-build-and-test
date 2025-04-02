import * as core from '@actions/core';
import { getInputs } from './inputs.js';
import { restoreWorkspace } from './workspace.js';
import { verifyDotnetSDK, restoreDependencies } from './dotnet.js';
import { processMigrations } from './migrations.js';
import { runTests } from './test.js';
export async function run() {
    core.info(`[START] GitHub Action execution started at ${new Date().toISOString()}`);
    try {
        // Retrieve inputs.
        const { testFolder, migrationsFolder, envName, skipMigrations, skipTests, skipWorkspaceRestore, skipDotnetRestore, skipVerifySdk, useGlobalDotnetEf } = getInputs();
        // Restore workspace.
        if (!skipWorkspaceRestore) {
            await restoreWorkspace();
        }
        else {
            core.info('Skipping migrations as requested.');
        }
        // Verify .NET SDK and restore dependencies.
        if (!skipVerifySdk) {
            await verifyDotnetSDK();
        }
        else {
            core.info('Skipping migrations as requested.');
        }
        if (!skipDotnetRestore) {
            await restoreDependencies();
        }
        // Process migrations if not skipped.
        if (!skipMigrations) {
            await processMigrations(envName, useGlobalDotnetEf, migrationsFolder);
        }
        else {
            core.info('Skipping migrations as requested.');
        }
        // Run tests.
        if (!skipTests) {
            await runTests(testFolder);
        }
        else {
            core.info('Skipping migrations as requested.');
        }
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
