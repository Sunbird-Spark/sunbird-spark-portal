import { test as setup } from '@playwright/test';
import fs from 'fs';
import { users } from '../../data/users';
import { authPaths } from '../../data/authPaths';
import { loginAsUser } from '../helpers/loginHelper';

setup('authenticate as user2', async ({ page }) => {
  fs.mkdirSync('.auth', { recursive: true });
  await loginAsUser(page, users.user2.email, users.user2.password);
  await page.context().storageState({ path: authPaths.user2 });
  console.log('user2 session saved to', authPaths.user2);
});
