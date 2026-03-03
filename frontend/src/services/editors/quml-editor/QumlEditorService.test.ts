import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QumlEditorService, type QuestionSetMetadata } from './';
import editorConfigService from '../EditorConfigService';

vi.mock('../EditorConfigService', () => ({
  default: {
    fetchBaseContext: vi.fn(),
    fetchChannelData: vi.fn(),
  },
  editorConfigService: {
    fetchBaseContext: vi.fn(),
    fetchChannelData: vi.fn(),
  },
}));

describe('QumlEditorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose a service class', () => {
    const service = new QumlEditorService();
    expect(service).toBeInstanceOf(QumlEditorService);
  });

  it('createConfig should build editor config with metadata defaults', async () => {
    const metadata: QuestionSetMetadata = {
      identifier: 'do_123',
      name: 'Sample Question Set',
      primaryCategory: 'Practice Question Set',
      objectType: 'QuestionSet',
      status: 'draft',
      createdBy: 'user-123',
      channel: 'channel-from-metadata',
      mimeType: 'application/vnd.sunbird.questionset',
    } as QuestionSetMetadata;

    const service = new QumlEditorService();
    vi.mocked(editorConfigService.fetchBaseContext).mockResolvedValue({
      sid: '',
      uid: 'user-123',
      did: 'device-123',
      channel: 'channel-from-metadata',
      pdata: { id: 'sunbird.portal', ver: '1.0', pid: 'sunbird.portal' },
    });

    const config = await service.createConfig(metadata);

    expect(config.context.identifier).toBe(metadata.identifier);
    expect(config.context.channel).toBe('channel-from-metadata');
    expect(config.context.sid).toBe('');
    expect(config.context.did).toBe('device-123');
    expect(config.context.uid).toBe('user-123');
    expect(config.context.user.id).toBe('user-123');
    expect(config.context.pdata.id).toBe('sunbird.portal');
    expect(config.config.primaryCategory).toBe(metadata.primaryCategory);
    expect(config.config.objectType).toBe(metadata.objectType);
    expect(config.config.mode).toBe('edit');
  });
});
