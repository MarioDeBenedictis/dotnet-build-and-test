import * as core from '@actions/core'

export interface ActionInputs {
  testFolder: string
  migrationsFolder: string

  envName: string

  skipMigrations: boolean
  skipTests: boolean
  skipWorkspaceRestore: boolean
  skipDotnetRestore: boolean
  skipVerifySdk: boolean

  useGlobalDotnetEf: boolean
}

export function getInputs(): ActionInputs {
  const testFolder: string = core.getInput('testFolder') || './tests'
  const migrationsFolder: string = core.getInput('migrationsFolder')
  const envName: string = core.getInput('envName') || 'Test'
  const skipMigrations: boolean = core.getInput('skipMigrations') === 'true'
  const skipTests: boolean = core.getInput('skipTests') === 'true'
  const useGlobalDotnetEf: boolean =
    core.getInput('useGlobalDotnetEf') === 'true'
  const skipWorkspaceRestore: boolean =
    core.getInput('skipWorkspaceRestore') == 'true'
  const skipDotnetRestore: boolean =
    core.getInput('skipDotnetRestore') == 'true'
  const skipVerifySdk: boolean = core.getInput('skipVerifySdk') == 'true'

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
    
    
    `)

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
  }
}
