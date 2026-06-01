import { readFile, writeFile, access } from 'fs/promises';
import { constants } from 'fs';
import * as path from 'path';

async function fileExists(p: string): Promise<boolean> {
    try { await access(p, constants.F_OK); return true; }
    catch { return false; }
}

function upsertEnvVar(envContent: string, key: string, value: string): string {
    const line = `${key}=${value}`;
    const regex = new RegExp(`^${key}=.*`, 'm');
    return regex.test(envContent)
        ? envContent.replace(regex, line)
        : envContent.trimEnd() + '\n' + line + '\n';
}

export async function saveTempUser(email: string, password: string, name: string = 'Test User') {
    const jsonPath = path.join(__dirname, '..', 'data', 'temp_user.json');
    await writeFile(jsonPath, JSON.stringify({ email, name }, null, 2));

    const envPath = path.join(__dirname, '..', '.env');
    let envContent = (await fileExists(envPath)) ? await readFile(envPath, 'utf-8') : '';
    envContent = upsertEnvVar(envContent, 'TEST_USER_PASSWORD', password);
    envContent = upsertEnvVar(envContent, 'TEMP_USER_EMAIL', email);
    await writeFile(envPath, envContent);

    process.env.TEST_USER_PASSWORD = password;
    process.env.TEMP_USER_EMAIL = email;

    console.log(`Saved temp user (${email}) to temp_user.json and .env`);
}

export async function getTempUser() {
    const filePath = path.join(__dirname, '..', 'data', 'temp_user.json');
    if (await fileExists(filePath)) {
        const data = JSON.parse(await readFile(filePath, 'utf-8'));
        const password = process.env.TEST_USER_PASSWORD ?? 'StrongPassword@123';
        return { ...data, password };
    }
    return null;
}
