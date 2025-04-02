import * as core from '@actions/core'

export interface ActionInputs {
  testFolder: string
  migrationsFolder: string
  envName: string
  skipMigrations: boolean
  useGlobalDotnetEf: boolean
}

export function getInputs(): ActionInputs {
  const testFolder: string = core.getInput('testFolder') || './tests'
  const migrationsFolder: string = core.getInput('migrationsFolder')
  const envName: string = core.getInput('envName') || 'Test'
  const skipMigrations: boolean = core.getInput('skipMigrations') === 'true'
  const useGlobalDotnetEf: boolean =
    core.getInput('useGlobalDotnetEf') === 'true'

  core.info(`Loaded inputs:
    - Test Folder: ${testFolder}
    - Migration folder: ${migrationsFolder}
    - Environment: ${envName}
    - Skip Migrations: ${skipMigrations}
    - Use Global dotnet-ef: ${useGlobalDotnetEf}`)

  return {
    testFolder,
    migrationsFolder,
    envName,
    skipMigrations,
    useGlobalDotnetEf
  }
}
