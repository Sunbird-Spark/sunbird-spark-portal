import * as fs from 'fs';
import * as path from 'path';

export function saveTempUser(email: string, password: string, name: string = 'Test User') {
    const data = { email, password, name };
    const filePath = path.join(__dirname, '..', 'data', 'temp_user.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Saved temporary user to ${filePath}`);
}

export function getTempUser() {
    const filePath = path.join(__dirname, '..', 'data', 'temp_user.json');
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return null;
}
