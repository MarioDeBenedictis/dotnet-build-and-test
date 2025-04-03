import * as core from '@actions/core'
import * as exec from '@actions/exec'

/**
 * Executes EF Core migrations. If there are pending migrations,
 * it applies them. Uses either a globally installed dotnet-ef tool or a local installation.
 *
 * @param envName - The ASP.NET Core environment name.
 * @param useGlobalDotnetEf - Location of global dotnet.
 * @param useGlobalDotnetEf - Whether to use the global dotnet-ef installation.
 * @param migrationsFolder - The folder containing the migrations.
 * @param getExecOutput - Flag to determine the method of execution output.
 */
export async function processMigrations(
  envName: string,
  dotnetRoot: string,
  useGlobalDotnetEf: boolean,
  migrationsFolder: string,
  getExecOutput: boolean
): Promise<void> {
  // Retrieve dotnetRoot from action inputs (defaulting to '/usr/share/dotnet' if not provided)
  // const dotnetRoot: string = core.getInput('dotnetRoot') || '/usr/share/dotnet'

  let migrationOutput = ''
  const migrationOptions: exec.ExecOptions = {
    cwd: migrationsFolder,
    env: { DOTNET_ROOT: dotnetRoot },
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
    core.info('Installing dotnet-ef tool locally...')
    if (getExecOutput) {
      await exec.exec(
        'dotnet',
        ['tool', 'install', 'dotnet-ef', '--tool-path', './.dotnetTools'],
        { cwd: migrationsFolder /*, env: { DOTNET_ROOT: dotnetRoot }*/ }
      )
    } else {
      await exec.getExecOutput(
        'dotnet',
        ['tool', 'install', 'dotnet-ef', '--tool-path', './.dotnetTools'],
        { cwd: migrationsFolder, env: { DOTNET_ROOT: dotnetRoot } }
      )
    }
    core.info('dotnet-ef installed locally.')
    efCmd = './.dotnetTools/dotnet-ef'
    efArgs = ['migrations', 'list']
  }

  core.info(`Listing migrations in folder: ${migrationsFolder}...`)
  if (getExecOutput) {
    const result = await exec.getExecOutput(efCmd, efArgs, migrationOptions)
    core.info(result.stdout)
  } else {
    await exec.exec(efCmd, efArgs, migrationOptions)
    core.info(migrationOutput)
  }

  // If no "[applied]" string is found in the output, assume there are pending migrations.
  if (migrationOutput.indexOf('[applied]') === -1) {
    core.info('Pending migrations detected. Applying migrations...')
    const updateArgs = ['database', 'update']
    await exec.getExecOutput(efCmd, updateArgs, {
      cwd: migrationsFolder,
      env: { DOTNET_ROOT: dotnetRoot, ASPNETCORE_ENVIRONMENT: envName }
    })
    core.info('Migrations applied successfully.')
  } else {
    core.info('No pending migrations.')
  }
}
