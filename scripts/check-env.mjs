
import fs from 'fs';
try {
  const env = fs.readFileSync('.env.local', 'utf8');
  console.log('Token present:', env.includes('SANITY_API_TOKEN') || env.includes('SANITY_TOKEN'));
} catch (e) { console.log('No .env.local'); }
