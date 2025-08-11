import * as dotenv from 'dotenv';
import * as fs from 'fs';

export function reloadEnv() {
    const envFilePath = '.env';
    if (fs.existsSync(envFilePath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envFilePath));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
        console.log('⚡️ Env variables reloaded at runtime');
    } else {
        console.warn('⚠️ .env file not found to reload');
    }
}
