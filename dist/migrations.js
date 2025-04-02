import * as core from '@actions/core';
import * as exec from '@actions/exec';
export async function processMigrations(envName, useGlobalDotnetEf) {
    let migrationOutput = '';
    const dotnetRoot = '/usr/share/dotnet'; // location of the .NET runtime on Ubuntu
    const commonEnv = { ...process.env, DOTNET_ROOT: dotnetRoot };
    const migrationOptions = {
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
        // Install dotnet-ef locally into ./.dotnetTools if not already installed.
        core.info('Installing dotnet-ef tool locally...');
        await exec.exec('dotnet', ['tool', 'install', 'dotnet-ef', '--tool-path', './.dotnetTools'], { env: commonEnv });
        core.info('dotnet-ef installed locally.');
        // Use the local installation.
        efCmd = './.dotnetTools/dotnet-ef';
        efArgs = ['migrations', 'list'];
    }
    core.info('Listing migrations...');
    const result = await exec.getExecOutput(efCmd, efArgs, migrationOptions);
    core.info(result.stdout);
    // If the output does not contain the "[applied]" marker, assume there are pending migrations.
    if (migrationOutput.indexOf('[applied]') === -1) {
        core.info('Pending migrations detected. Applying migrations...');
        const updateArgs = useGlobalDotnetEf
            ? ['database', 'update']
            : ['database', 'update']; // same args in either case
        await exec.getExecOutput(efCmd, updateArgs, {
            env: { ...commonEnv, ASPNETCORE_ENVIRONMENT: envName }
        });
        core.info('Migrations applied.');
    }
    else {
        core.info('No pending migrations.');
    }
}
