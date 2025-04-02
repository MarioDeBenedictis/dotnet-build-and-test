import * as core from '@actions/core';
import * as exec from '@actions/exec';
export async function processMigrations(envName, useGlobalDotnetEf, migrationsFolder) {
    let migrationOutput = '';
    const dotnetRoot = '/usr/share/dotnet'; // typical location for .NET on Ubuntu
    const commonEnv = { ...process.env, DOTNET_ROOT: dotnetRoot };
    const migrationOptions = {
        cwd: migrationsFolder,
        env: commonEnv,
        listeners: {
            stdout: (data) => {
                migrationOutput += data.toString();
            }
        }
    };
    let efCmd;
    let efArgs;
    if (useGlobalDotnetEf) {
        efCmd = 'dotnet-ef';
        efArgs = ['migrations', 'list'];
    }
    else {
        core.info('Installing dotnet-ef tool locally...');
        await exec.exec('dotnet', ['tool', 'install', 'dotnet-ef', '--tool-path', './.dotnetTools'], { cwd: migrationsFolder, env: commonEnv });
        core.info('dotnet-ef installed locally.');
        efCmd = './.dotnetTools/dotnet-ef';
        efArgs = ['migrations', 'list'];
    }
    core.info(`Listing migrations in folder: ${migrationsFolder}...`);
    const result = await exec.getExecOutput(efCmd, efArgs, migrationOptions);
    core.info(result.stdout);
    if (migrationOutput.indexOf('[applied]') === -1) {
        core.info('Pending migrations detected. Applying migrations...');
        const updateArgs = ['database', 'update'];
        await exec.getExecOutput(efCmd, updateArgs, {
            cwd: migrationsFolder,
            env: { ...commonEnv, ASPNETCORE_ENVIRONMENT: envName }
        });
        core.info('Migrations applied.');
    }
    else {
        core.info('No pending migrations.');
    }
}
