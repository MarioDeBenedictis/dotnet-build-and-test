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

  let efCmd: string
  let efArgs: string[]

  if (useGlobalDotnetEf) {
    efCmd = 'dotnet-ef'
    efArgs = ['migrations', 'list']
  } else {
    // Install dotnet-ef locally into ./.dotnetTools if not already installed.
    core.info('Installing dotnet-ef tool locally...')
    await exec.exec('dotnet', [
      'tool',
      'install',
      'dotnet-ef',
      '--tool-path',
      './.dotnetTools'
    ])
    core.info('dotnet-ef installed locally.')
    // Use the local installation.
    efCmd = './.dotnetTools/dotnet-ef'
    efArgs = ['migrations', 'list']
  }

  core.info('Listing migrations...')
  await exec.getExecOutput(efCmd, efArgs, migrationOptions)

  // If the output does not contain the "[applied]" marker, assume there are pending migrations.
  if (migrationOutput.indexOf('[applied]') === -1) {
    core.info('Pending migrations detected. Applying migrations...')
    const updateArgs = useGlobalDotnetEf
      ? ['database', 'update']
      : ['database', 'update'] // same args, since command is different (local tool)
    await exec.getExecOutput(efCmd, updateArgs, {
      env: { ...process.env, ASPNETCORE_ENVIRONMENT: envName }
    })
    core.info('Migrations applied.')
  } else {
    core.info('No pending migrations.')
  }
}
