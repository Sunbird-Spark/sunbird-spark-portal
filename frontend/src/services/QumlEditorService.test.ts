import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QumlEditorService, qumlEditorService, type QuestionSetMetadata } from './QumlEditorService';
import appCoreService from './AppCoreService';

describe('QumlEditorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose a singleton instance', () => {
    const service = qumlEditorService;
    expect(service).toBeInstanceOf(QumlEditorService);
  });

  it('createEditorConfig should build editor config with metadata defaults', async () => {
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
    vi.spyOn(appCoreService, 'getDeviceId').mockResolvedValue('device-123');
    vi.spyOn(appCoreService, 'getPData').mockResolvedValue({ id: 'sunbird.portal', ver: '1.0', pid: 'sunbird.portal' });
    vi.spyOn<any, any>(service, 'fetchUserInfo').mockResolvedValue({ firstName: 'Jane', lastName: 'Doe', fullName: 'Jane Doe', userName: 'janedoe' });
    vi.spyOn<any, any>(service['orgService'], 'search').mockResolvedValue({ data: { result: { response: { content: [] } } } });
    const config = await service.createEditorConfig(metadata);

    expect(config.context.identifier).toBe(metadata.identifier);
    expect(config.context.channel).toBe('channel-from-metadata');
    expect(config.context.sid).toBe('');
    expect(config.context.did).toBe('device-123');
    expect(config.context.uid).toBe(metadata.createdBy);
    expect(config.context.user).toEqual({ firstName: 'Jane', lastName: 'Doe', fullName: 'Jane Doe', userName: 'janedoe' });
    expect(config.context.pdata.id).toBe('sunbird.portal');
    expect(config.config.primaryCategory).toBe(metadata.primaryCategory);
    expect(config.config.objectType).toBe(metadata.objectType);
    expect(config.config.mode).toBe('edit'); // derived from status 'draft'
  });
});
