import * as core from '@actions/core';
export function getInputs() {
    const testFolder = core.getInput('testFolder') || './tests';
    const migrationsFolder = core.getInput('migrationsFolder');
    const envName = core.getInput('envName') || 'Test';
    const skipMigrations = core.getInput('skipMigrations') === 'true';
    const useGlobalDotnetEf = core.getInput('useGlobalDotnetEf') === 'true';
    core.info(`Loaded inputs:
    - Test Folder: ${testFolder}
    - Migration folder: ${migrationsFolder}
    - Environment: ${envName}
    - Skip Migrations: ${skipMigrations}
    - Use Global dotnet-ef: ${useGlobalDotnetEf}`);
    return {
        testFolder,
        migrationsFolder,
        envName,
        skipMigrations,
        useGlobalDotnetEf
    };
}
