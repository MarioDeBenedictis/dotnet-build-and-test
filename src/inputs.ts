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
  dotnetRoot: string
  useGlobalDotnetEf: boolean
  getExecOutput: boolean
  // Additional inputs for test configuration:
  testFormat: string
  parallelTests: boolean
  testTimeout: number
  customDotnetArgs: string
}

export function getInputs(): ActionInputs {
  const testFolder: string = core.getInput('testFolder') || './tests'
  const migrationsFolder: string =
    core.getInput('migrationsFolder') || testFolder
  const envName: string = core.getInput('envName') || 'Test'
  const skipMigrations: boolean = core.getInput('skipMigrations') === 'true'
  const skipTests: boolean = core.getInput('skipTests') === 'true'
  const dotnetRoot: string = core.getInput('dotnetRoot') || 'usr/bin/dotnet'
  // const useGlobalDotnetEf: boolean =
  //   core.getBooleanInput('useGlobalDotnetEf') === true
  const useGlobalDotnetEf: boolean =
    core.getInput('useGlobalDotnetEf') === 'true'
  const skipWorkspaceRestore: boolean =
    core.getInput('skipWorkspaceRestore') === 'true'
  const skipDotnetRestore: boolean =
    core.getInput('skipDotnetRestore') === 'true'
  const skipVerifySdk: boolean = core.getInput('skipVerifySdk') === 'true'
  const getExecOutput: boolean = core.getInput('getExecOutput') === 'true'
  const testFormat: string = core.getInput('testFormat') || 'html'
  const parallelTests: boolean = core.getInput('parallelTests') === 'true'
  const testTimeout: number = parseInt(core.getInput('testTimeout')) || 60
  const customDotnetArgs: string = core.getInput('customDotnetArgs') || ''

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
    dotnetRoot,
    useGlobalDotnetEf,
    getExecOutput,
    testFormat,
    parallelTests,
    testTimeout,
    customDotnetArgs
  }
}
