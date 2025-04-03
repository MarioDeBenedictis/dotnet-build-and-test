import { processMigrations } from '../__fixtures__/migrations.js'

describe('processMigrations fixture', () => {
  beforeEach(() => {
    // Clear any previous calls to the mock before each test
    processMigrations.mockClear()
  })

  it('should be callable and resolve to undefined', async () => {
    // Arrange: Set the mock to resolve with undefined
    processMigrations.mockResolvedValue(undefined)

    // Act: Call the processMigrations function with test arguments
    const envName = 'Production'
    const useGlobalDotnetEf = false
    const migrationsFolder = './Migrations'
    const result = await processMigrations(
      envName,
      useGlobalDotnetEf,
      migrationsFolder
    )

    // Assert: Check that the mock was called with the correct arguments and resolved as expected
    expect(processMigrations).toHaveBeenCalledWith(
      envName,
      useGlobalDotnetEf,
      migrationsFolder
    )
    expect(result).toBeUndefined()
  })
})
