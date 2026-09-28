const { existsSync } = require('node:fs');

if (existsSync('.env')) {
    process.loadEnvFile('.env');
}
