import * as core from '@actions/core'
import * as exec from '@actions/exec'

export async function processMigrations(
  envName: string,
  useGlobalDotnetEf: boolean
): Promise<void> {
  let migrationOutput = ''
  const migrationOptions: exec.ExecOptions = {
    listeners: {
      stdout: (data: Buffer) => {
        migrationOutput += data.toString()
      }
    }
  }

  // Choose the correct command and arguments based on user input.
  const efCmd = useGlobalDotnetEf ? 'dotnet-ef' : 'dotnet'
  const efArgs = useGlobalDotnetEf
    ? ['migrations', 'list']
    : ['ef', 'migrations', 'list']

  core.info('Listing migrations...')
  await exec.exec(efCmd, efArgs, migrationOptions)

  // If the output does not contain the "[applied]" marker, assume there are pending migrations.
  if (migrationOutput.indexOf('[applied]') === -1) {
    core.info('Pending migrations detected. Applying migrations...')
    const updateArgs = useGlobalDotnetEf
      ? ['database', 'update']
      : ['ef', 'database', 'update']
    await exec.exec(efCmd, updateArgs, {
      env: { ...process.env, ASPNETCORE_ENVIRONMENT: envName }
    })
    core.info('Migrations applied.')
  } else {
    core.info('No pending migrations.')
  }
}
