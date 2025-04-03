import * as core from '@actions/core';
export function getInputs() {
    const testFolder = core.getInput('testFolder') || './tests';
    const migrationsFolder = core.getInput('migrationsFolder') || testFolder;
    const envName = core.getInput('envName') || 'Test';
    const skipMigrations = core.getInput('skipMigrations') === 'true';
    const skipTests = core.getInput('skipTests') === 'true';
    const dotnetRoot = core.getInput('dotnetRoot') || 'usr/bin/dotnet';
    const useGlobalDotnetEf = core.getInput('useGlobalDotnetEf') === 'false';
    const skipWorkspaceRestore = core.getInput('skipWorkspaceRestore') === 'true';
    const skipDotnetRestore = core.getInput('skipDotnetRestore') === 'true';
    const skipVerifySdk = core.getInput('skipVerifySdk') === 'true';
    const getExecOutput = core.getInput('getExecOutput') === 'true';
    const testFormat = core.getInput('testFormat') || 'html';
    const parallelTests = core.getInput('parallelTests') === 'true';
    const testTimeout = parseInt(core.getInput('testTimeout')) || 60;
    const customDotnetArgs = core.getInput('customDotnetArgs') || '';
    core.info(`Loaded inputs:
  - Test Folder: ${testFolder}
  - Migration Folder: ${migrationsFolder}
  - Environment: ${envName}
  - Skip Migrations: ${skipMigrations}
  - Skip Tests: ${skipTests}
  - Dotnet Root: ${dotnetRoot}
  - Use Global dotnet-ef: ${useGlobalDotnetEf}
  - Skip Workspace Restore: ${skipWorkspaceRestore}
  - Skip Dotnet Restore: ${skipDotnetRestore}
  - Skip Verify SDK: ${skipVerifySdk}
  - getExecOutput: ${getExecOutput}
  - Test Format: ${testFormat}
  - Parallel Tests: ${parallelTests}
  - Test Timeout: ${testTimeout}
  - Custom Dotnet Args: ${customDotnetArgs}
  `);
    return {
        testFolder,
        migrationsFolder,
        envName,
        skipMigrations,
        skipTests,
        skipWorkspaceRestore,
        skipDotnetRestore,
        skipVerifySdk,
        dotnetRoot,
        useGlobalDotnetEf,
        getExecOutput,
        testFormat,
        parallelTests,
        testTimeout,
        customDotnetArgs
    };
}
