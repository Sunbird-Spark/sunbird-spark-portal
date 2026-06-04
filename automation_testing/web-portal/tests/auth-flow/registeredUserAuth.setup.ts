import { test as setup } from '@playwright/test';
import fs from 'fs';
import { users } from '../../data/users';
import { authPaths } from '../../data/authPaths';
import { loginAsUser } from '../helpers/loginHelper';

setup('authenticate as registered user', async ({ page }) => {
  fs.mkdirSync('.auth', { recursive: true });
  await loginAsUser(page, users.registeredUser.email, users.registeredUser.password);
  await page.context().storageState({ path: authPaths.registeredUser });
  console.log('Registered user session saved to', authPaths.registeredUser);
});
