import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionEditorService } from './CollectionEditorService';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';

vi.mock('../../userAuthInfoService/userAuthInfoService');
vi.mock('../../AppCoreService');
vi.mock('../../OrganizationService');

describe('CollectionEditorService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('builds config with fetched values', async () => {
    (userAuthInfoService.getSessionId as any) = vi.fn().mockReturnValue('sid-1');
    (userAuthInfoService.getUserId as any) = vi.fn().mockReturnValue('uid-1');
    (appCoreService.getDeviceId as any) = vi.fn().mockResolvedValue('device-1');
    (appCoreService.getPData as any) = vi.fn().mockResolvedValue({ id: 'sunbird.portal', ver: '1.0', pid: 'sunbird.portal' });

    vi.spyOn(OrganizationService.prototype, 'search').mockResolvedValue({ data: { result: { response: { content: [{ channel: 'channel-1' }] } } } } as any);

    const service = new CollectionEditorService();
    const config = await service.createConfig({ identifier: 'do_123', name: 'Sample' }, { mode: 'edit' });

    expect(config.context.sid).toBe('sid-1');
    expect(config.context.did).toBe('device-1');
    expect(config.context.uid).toBe('uid-1');
    expect(config.context.channel).toBe('channel-1');
    expect(config.context.pdata.id).toBe('sunbird.portal');
    expect(config.context.mode).toBe('edit');
    expect(config.metadata.identifier).toBe('do_123');
  });
});
