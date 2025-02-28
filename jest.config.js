module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // A list of paths to directories that Jest should use to search for files in
  roots: ["<rootDir>/test"],

  // The test environment that will be used for testing
  testEnvironment: "node",

  // Setup files that will run before each test
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],

  // By default Jest runs all tests in parallel which can cause issues with the database
  // Use a higher value if needed, but 1 is safer for database tests
  maxWorkers: 1,

  // Time in milliseconds for tests to complete
  testTimeout: 10000,

  // Global variables that will be available in all test files
  globals: {
    // Add any global variables needed in tests
  },
};
