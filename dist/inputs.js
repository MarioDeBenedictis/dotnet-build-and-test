import * as core from '@actions/core';
export function getInputs() {
    const testFolder = core.getInput('testFolder') || './tests';
    const migrationsFolder = core.getInput('migrationsFolder');
    const envName = core.getInput('envName') || 'Test';
    const skipMigrations = core.getInput('skipMigrations') === 'true';
    const skipTests = core.getInput('skipTests') === 'true';
    const useGlobalDotnetEf = core.getInput('useGlobalDotnetEf') === 'true';
    const skipWorkspaceRestore = core.getInput('skipWorkspaceRestore') == 'true';
    const skipDotnetRestore = core.getInput('skipDotnetRestore') == 'true';
    const skipVerifySdk = core.getInput('skipVerifySdk') == 'true';
    core.info(`Loaded inputs:
    - Test Folder: ${testFolder}
    - Migration folder: ${migrationsFolder}
    - Environment: ${envName}
    - Skip Migrations: ${skipMigrations}
    - Skip Tests: ${skipTests}
    - Use Global dotnet-ef: ${useGlobalDotnetEf}
    - Skip Workspace Restore: ${skipWorkspaceRestore}
    - Skip Dotnet Restore: ${skipDotnetRestore}
    - Skip Verify SDK: ${skipVerifySdk}
    
    
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
        useGlobalDotnetEf
    };
}
