const env = process.env;

export const config = {
    PORT: parseInt(env.PORT || '4000'),
    DOCKER_IMAGE: env.DOCKER_IMAGE || 'e2e-runner',
    // Rebuilt from this path before every run (see dockerRunner.rebuildImage) so the
    // image can never silently drift from current source — relative to this service's
    // own working directory, matching the layout documented in this service's README.
    WEB_PORTAL_DIR: env.WEB_PORTAL_DIR || '../web-portal',
    RUNS_DIR: env.RUNS_DIR || './runs',
    TRIGGER_SHARED_SECRET: env.TRIGGER_SHARED_SECRET || '',
    ALLOW_NO_AUTH: env.ALLOW_NO_AUTH === '1',

    BASE_URL: env.BASE_URL || 'https://test.sunbirded.org',
    REGISTERED_USER_EMAIL: env.REGISTERED_USER_EMAIL || 'user1@yopmail.com',
    REGISTERED_USER_PASSWORD: env.REGISTERED_USER_PASSWORD || 'User1@123',
    USER2_EMAIL: env.USER2_EMAIL || 'user2@yopmail.com',
    USER2_PASSWORD: env.USER2_PASSWORD || 'User2@123',
};

export function assertAuthConfigured(cfg: Pick<typeof config, 'TRIGGER_SHARED_SECRET' | 'ALLOW_NO_AUTH'>): void {
    if (!cfg.TRIGGER_SHARED_SECRET && !cfg.ALLOW_NO_AUTH) {
        throw new Error(
            'TRIGGER_SHARED_SECRET is not set. Refusing to start with an unauthenticated trigger endpoint. ' +
                'Set TRIGGER_SHARED_SECRET, or set ALLOW_NO_AUTH=1 to explicitly run without auth (local dev only).'
        );
    }
}
