
import fs from 'fs';
const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length > 0) console.log(`Key: '${parts[0].trim()}'`);
});
