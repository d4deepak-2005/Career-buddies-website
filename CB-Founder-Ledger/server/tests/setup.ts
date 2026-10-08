// Runs before every test file: deterministic, isolated configuration.
process.env['NODE_ENV'] = 'test';
process.env['MONGO_URI'] = process.env['TEST_MONGO_URI'] ?? 'mongodb://127.0.0.1:27017/cb_founder_ledger_test';
process.env['JWT_ACCESS_SECRET'] = 'test-only-access-secret-0123456789abcdef-test';
process.env['CLIENT_ORIGIN'] = 'http://localhost:5173';
process.env['BCRYPT_COST'] = '4';
process.env['AUTH_RATE_LIMIT_MAX'] = '1000';
process.env['COOKIE_SECURE'] = 'false';
