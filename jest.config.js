// Jest copies process.env before running setupFiles.
process.loadEnvFile('test/test.env');

const config = {
    setupFiles: [
        "<rootDir>/test/setupTests.js"
    ],
}

module.exports = config;
