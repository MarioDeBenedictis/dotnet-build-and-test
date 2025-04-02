import * as core from '@actions/core'

export interface ActionInputs {
  testFolder: string
  envName: string
  skipMigrations: boolean
  useGlobalDotnetEf: boolean
}

export function getInputs(): ActionInputs {
  const testFolder: string = core.getInput('testFolder') || './tests'
  const envName: string = core.getInput('envName') || 'Test'
  const skipMigrations: boolean = core.getInput('skipMigrations') === 'true'
  const useGlobalDotnetEf: boolean =
    core.getInput('useGlobalDotnetEf') === 'true'

  core.info(`Loaded inputs:
    - Test Folder: ${testFolder}
    - Environment: ${envName}
    - Skip Migrations: ${skipMigrations}
    - Use Global dotnet-ef: ${useGlobalDotnetEf}`)

  return { testFolder, envName, skipMigrations, useGlobalDotnetEf }
}
