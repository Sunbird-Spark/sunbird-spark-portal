function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}. Add it to automation_testing/web-portal/.env`);
  return value;
}

export const users = {
  contentCreator: {
    get email() { return requireEnv('CONTENT_CREATOR_EMAIL'); },
    get password() { return requireEnv('CONTENT_CREATOR_PASSWORD'); },
  },
  registeredUser: {
    get email() { return requireEnv('REGISTERED_USER_EMAIL'); },
    get password() { return requireEnv('REGISTERED_USER_PASSWORD'); },
  },
};
