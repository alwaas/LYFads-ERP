import * as dotenv from 'dotenv';

// Load test environment variables from .env.test
dotenv.config({ path: '.env.test' });

console.log('✓ Test environment loaded from .env.test');
