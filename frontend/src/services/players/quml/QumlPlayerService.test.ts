import { describe, it, expect } from 'vitest';
import { buildQumlPlayerConfig } from './QumlPlayerService';

describe('buildQumlPlayerConfig', () => {
  const baseMetadata = {
    identifier: 'do_123',
    name: 'Test QuestionSet',
    channel: '0123456789',
  };

  it('builds a basic config with defaults', () => {
    const config = buildQumlPlayerConfig({ metadata: baseMetadata });

    expect(config.context.identifier).toBe('do_123');
    expect(config.context.contentId).toBe('do_123');
    expect(config.context.uid).toBe('anonymous');
    expect(config.context.env).toBe('contentplayer');
    expect(config.metadata).toEqual(baseMetadata);
  });

  it('applies orgChannel and deviceId correctly', () => {
    const config = buildQumlPlayerConfig({
      metadata: baseMetadata,
      orgChannel: 'channel-1',
      deviceId: 'device-1',
    });

    expect(config.context.channel).toBe('channel-1');
    expect(config.context.did).toBe('device-1');
    expect(config.context.contextRollup).toEqual({ l1: 'channel-1' });
  });

  it('honors uid and dialCode overrides', () => {
    const config = buildQumlPlayerConfig({
      metadata: baseMetadata,
      uid: 'user-1',
      dialCode: 'DIAL123',
    });

    expect(config.context.uid).toBe('user-1');
    expect(config.context.cdata).toEqual([{ id: 'DIAL123', type: 'DialCode' }]);
  });

  it('merges context and config overrides', () => {
    const config = buildQumlPlayerConfig({
      metadata: baseMetadata,
      overrides: {
        context: { mode: 'review' },
        config: { showSolutions: true },
      },
    });

    expect(config.context.mode).toBe('review');
    expect(config.config.showSolutions).toBe(true);
  });
});
