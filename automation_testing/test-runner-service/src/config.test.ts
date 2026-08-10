import { describe, it, expect } from 'vitest';
import { assertAuthConfigured } from './config.js';

describe('assertAuthConfigured', () => {
    it('throws when no secret is set and no-auth is not explicitly allowed', () => {
        expect(() => assertAuthConfigured({ TRIGGER_SHARED_SECRET: '', ALLOW_NO_AUTH: false })).toThrow(
            'TRIGGER_SHARED_SECRET is not set'
        );
    });

    it('does not throw when a secret is set', () => {
        expect(() => assertAuthConfigured({ TRIGGER_SHARED_SECRET: 'hunter2', ALLOW_NO_AUTH: false })).not.toThrow();
    });

    it('does not throw when no-auth is explicitly allowed, even with no secret', () => {
        expect(() => assertAuthConfigured({ TRIGGER_SHARED_SECRET: '', ALLOW_NO_AUTH: true })).not.toThrow();
    });
});
