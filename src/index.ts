import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function run(): Promise<void> {
  // This variable will store the last applied migration.
  let lastMigration = ''
  // We'll capture stdout when listing migrations.
  let migrationListStdout = ''
  const token = core.getInput('token')

  // If a token is provided, configure git to use it for authentication.
  if (token) {
    core.info('Configuring git to use provided token for GitHub access.')
    await exec.exec('git', [
      'config',
      '--global',
      `url.https://${token}@github.com/.insteadOf`,
      'https://github.com/'
    ])
  }

  try {
    // Cleanup: Restore files
    core.info('Performing cleanup (git restore)...')
    await exec.exec('git', ['restore', '.'])

    // Verify .NET SDK
    core.info('Verifying .NET SDK version...')
    await exec.exec('dotnet', ['--version'])

    // Restore dependencies and build the project
    core.info('Restoring dependencies...')
    await exec.exec('dotnet', ['restore'])

    core.info('Building the project...')
    await exec.exec('dotnet', ['build'])

    // Get input parameters
    const testFolder = core.getInput('testFolder')
    // migrationsFolder defaults to testFolder if not provided
    const migrationsFolder = core.getInput('migrationsFolder') || testFolder
    // Environment variable for .NET (default to 'Test')
    const envName = core.getInput('envName') || 'Test'

    core.info(`Using test folder: ${testFolder}`)
    core.info(`Using migrations folder: ${migrationsFolder}`)
    core.info(`Environment set to: ${envName}`)

    // Setup EF tool in migrations folder and run migrations
    core.info('Setting up tool manifest and installing dotnet-ef...')
    await exec.exec('dotnet', ['new', 'tool-manifest', '--force'], {
      cwd: migrationsFolder
    })
    await exec.exec('dotnet', ['tool', 'install', '--local', 'dotnet-ef'], {
      cwd: migrationsFolder
    })

    // Capture the last applied migration.
    core.info('Capturing the last applied EF Core migration...')
    const options: exec.ExecOptions = {
      cwd: migrationsFolder,
      listeners: {
        stdout: (data: Buffer) => {
          migrationListStdout += data.toString()
        }
      }
    }
    await exec.exec(
      'dotnet',
      ['ef', 'migrations', 'list', '--applied'],
      options
    )

    // Split the output and filter out any empty lines
    const migrations = migrationListStdout
      .trim()
      .split('\n')
      .filter((line) => line.trim() !== '')
    lastMigration = migrations[migrations.length - 1] || ''
    core.info(`Last applied migration: ${lastMigration}`)
    core.setOutput('lastMigration', lastMigration)

    // Run EF Core migrations to update the database using the specified environment.
    core.info('Updating database (applying migrations)...')
    await exec.exec('dotnet', ['ef', 'database', 'update'], {
      cwd: migrationsFolder,
      env: { ...process.env, ASPNETCORE_ENVIRONMENT: envName }
    })

    // Run API Tests and log output to HTML file
    core.info('Running API tests...')
    await exec.exec(
      'dotnet',
      [
        'test',
        '--logger',
        'html;LogFileName=integration-test-results.html',
        '--results-directory',
        'TestResults'
      ],
      { cwd: testFolder }
    )
  } catch (error) {
    core.error('An error occurred during the build or test process.')
    core.error('Attempting to rollback the test database...')

    try {
      // Reuse the provided input parameters in the rollback section.
      const testFolder = core.getInput('testFolder')
      const migrationsFolder = core.getInput('migrationsFolder') || testFolder
      const envName = core.getInput('envName') || 'Test'

      // Reinstall EF tool to ensure availability in the migrations folder
      await exec.exec('dotnet', ['new', 'tool-manifest', '--force'], {
        cwd: migrationsFolder
      })
      await exec.exec('dotnet', ['tool', 'install', '--local', 'dotnet-ef'], {
        cwd: migrationsFolder
      })

      if (lastMigration) {
        core.info(`Rolling back database to migration: ${lastMigration}`)
        await exec.exec(
          'dotnet',
          ['tool', 'run', 'dotnet-ef', 'database', 'update', lastMigration],
          {
            cwd: migrationsFolder,
            env: { ...process.env, ASPNETCORE_ENVIRONMENT: envName }
          }
        )
        core.info('Rollback completed.')
      } else {
        core.warning('No migration captured. Skipping rollback.')
      }
    } catch (rollbackError) {
      core.error(`Rollback failed with error: ${rollbackError}`)
    }
    core.setFailed(`Action failed with error: ${error}`)
  }
}

run()
