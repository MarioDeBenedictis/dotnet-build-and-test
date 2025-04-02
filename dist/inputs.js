import * as core from '@actions/core';
export function getInputs() {
    const testFolder = core.getInput('testFolder') || './tests';
    const envName = core.getInput('envName') || 'Test';
    const skipMigrations = core.getInput('skipMigrations') === 'true';
    const useGlobalDotnetEf = core.getInput('useGlobalDotnetEf') === 'true';
    core.info(`Loaded inputs:
    - Test Folder: ${testFolder}
    - Environment: ${envName}
    - Skip Migrations: ${skipMigrations}
    - Use Global dotnet-ef: ${useGlobalDotnetEf}`);
    return { testFolder, envName, skipMigrations, useGlobalDotnetEf };
}
