import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CollectionEditorService } from './CollectionEditorService';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';

vi.mock('../../userAuthInfoService/userAuthInfoService');
vi.mock('../../AppCoreService');
vi.mock('../../OrganizationService');

describe('CollectionEditorService - Config Creation', () => {
  let service: CollectionEditorService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new CollectionEditorService();
    (CollectionEditorService as any).dependenciesLoaded = false;
    (CollectionEditorService as any).stylesLoaded = false;
  });

  afterEach(() => {
    document.querySelectorAll('script[data-src]').forEach(el => el.remove());
    document.querySelectorAll('[data-collection-editor-styles]').forEach(el => el.remove());
  });

  describe('createConfig', () => {
    it('builds config with all fetched values', async () => {
      (userAuthInfoService.getSessionId as any) = vi.fn().mockReturnValue('sid-1');
      (userAuthInfoService.getUserId as any) = vi.fn().mockReturnValue('uid-1');
      (appCoreService.getDeviceId as any) = vi.fn().mockResolvedValue('device-1');
      (appCoreService.getPData as any) = vi.fn().mockResolvedValue({ 
        id: 'sunbird.portal', ver: '1.0', pid: 'sunbird.portal' 
      });

      vi.spyOn(OrganizationService.prototype, 'search').mockResolvedValue({ 
        data: { result: { response: { content: [{ channel: 'channel-1' }] } } } 
      } as any);

      const config = await service.createConfig(
        { identifier: 'do_123', name: 'Sample' }, 
        { mode: 'edit' }
      );

      expect(config.context.sid).toBe('sid-1');
      expect(config.context.did).toBe('device-1');
      expect(config.context.uid).toBe('uid-1');
      expect(config.context.channel).toBe('channel-1');
      expect(config.context.pdata.id).toBe('sunbird.portal');
      expect(config.context.mode).toBe('edit');
      expect(config.context.identifier).toBe('do_123');
      expect(config.context.user.id).toBe('uid-1');
      expect(config.context.user.orgIds).toEqual(['channel-1']);
      expect(config.metadata.identifier).toBe('do_123');
      expect(config.config.showAddCollaborator).toBe(true);
      expect(config.config.objectType).toBe('Collection');
      expect(config.config.primaryCategory).toBe('Content Playlist');
    });

    it('handles missing session ID', async () => {
      (userAuthInfoService.getSessionId as any) = vi.fn().mockReturnValue(null);
      (userAuthInfoService.getUserId as any) = vi.fn().mockReturnValue('uid-1');
      (appCoreService.getDeviceId as any) = vi.fn().mockResolvedValue('device-1');
      (appCoreService.getPData as any) = vi.fn().mockResolvedValue({ 
        id: 'sunbird.portal', ver: '1.0', pid: 'sunbird.portal' 
      });
      vi.spyOn(OrganizationService.prototype, 'search').mockResolvedValue({ 
        data: { result: { response: { content: [{ channel: 'ch1' }] } } } 
      } as any);

      const config = await service.createConfig({ identifier: 'do_123' }, { mode: 'edit' });

      expect(config.context.sid).toBe('');
    });

    it('uses anonymous when userId is missing', async () => {
      (userAuthInfoService.getSessionId as any) = vi.fn().mockReturnValue('sid-1');
      (userAuthInfoService.getUserId as any) = vi.fn().mockReturnValue(null);
      (appCoreService.getDeviceId as any) = vi.fn().mockResolvedValue('device-1');
      (appCoreService.getPData as any) = vi.fn().mockResolvedValue({ 
        id: 'sunbird.portal', ver: '1.0', pid: 'sunbird.portal' 
      });
      vi.spyOn(OrganizationService.prototype, 'search').mockResolvedValue({ 
        data: { result: { response: { content: [{ channel: 'ch1' }] } } } 
      } as any);

      const config = await service.createConfig({ identifier: 'do_123' }, { mode: 'edit' });

      expect(config.context.uid).toBe('anonymous');
      expect(config.context.user.id).toBe('anonymous');
    });

    it('handles device ID fetch failure', async () => {
      (userAuthInfoService.getSessionId as any) = vi.fn().mockReturnValue('sid-1');
      (userAuthInfoService.getUserId as any) = vi.fn().mockReturnValue('uid-1');
      (appCoreService.getDeviceId as any) = vi.fn().mockRejectedValue(new Error('Network error'));
      (appCoreService.getPData as any) = vi.fn().mockResolvedValue({ 
        id: 'sunbird.portal', ver: '1.0', pid: 'sunbird.portal' 
      });
      vi.spyOn(OrganizationService.prototype, 'search').mockResolvedValue({ 
        data: { result: { response: { content: [{ channel: 'ch1' }] } } } 
      } as any);

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const config = await service.createConfig({ identifier: 'do_123' }, { mode: 'edit' });

      expect(config.context.did).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch device ID:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('handles channel fetch failure', async () => {
      (userAuthInfoService.getSessionId as any) = vi.fn().mockReturnValue('sid-1');
      (userAuthInfoService.getUserId as any) = vi.fn().mockReturnValue('uid-1');
      (appCoreService.getDeviceId as any) = vi.fn().mockResolvedValue('device-1');
      (appCoreService.getPData as any) = vi.fn().mockResolvedValue({ 
        id: 'sunbird.portal', ver: '1.0', pid: 'sunbird.portal' 
      });
      vi.spyOn(OrganizationService.prototype, 'search').mockRejectedValue(
        new Error('Org fetch error')
      );

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const config = await service.createConfig({ identifier: 'do_123' }, { mode: 'edit' });

      expect(config.context.channel).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch channel info:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('uses custom contextRollup when provided', async () => {
      (userAuthInfoService.getSessionId as any) = vi.fn().mockReturnValue('sid-1');
      (userAuthInfoService.getUserId as any) = vi.fn().mockReturnValue('uid-1');
      (appCoreService.getDeviceId as any) = vi.fn().mockResolvedValue('device-1');
      (appCoreService.getPData as any) = vi.fn().mockResolvedValue({ 
        id: 'sunbird.portal', ver: '1.0', pid: 'sunbird.portal' 
      });
      vi.spyOn(OrganizationService.prototype, 'search').mockResolvedValue({ 
        data: { result: { response: { content: [{ channel: 'ch1' }] } } } 
      } as any);

      const config = await service.createConfig(
        { identifier: 'do_123' }, 
        { mode: 'edit', contextRollup: { l1: 'custom-channel' } }
      );

      expect(config.context.contextRollup).toEqual({ l1: 'custom-channel' });
    });
  });

  describe('createElement', () => {
    it('creates lib-editor element with config', () => {
      const config = {
        context: { identifier: 'do_123', mode: 'edit', sid: 'sid-1' },
        config: { showAddCollaborator: true },
        metadata: { identifier: 'do_123' }
      } as any;

      const element = service.createElement(config);

      expect(element.tagName.toLowerCase()).toBe('lib-editor');
      expect(element.getAttribute('editor-config')).toBe(JSON.stringify(config));
    });
  });

  describe('attachEventListeners', () => {
    it('attaches editor and telemetry event listeners', () => {
      const element = document.createElement('div');
      const onEditorEvent = vi.fn();
      const onTelemetryEvent = vi.fn();

      service.attachEventListeners(element, onEditorEvent, onTelemetryEvent);

      const editorEvent = new CustomEvent('editorEmitter', { detail: { action: 'save' } });
      element.dispatchEvent(editorEvent);

      expect(onEditorEvent).toHaveBeenCalledWith({
        type: 'editorEmitter',
        data: { action: 'save' }
      });

      const telemetryEvent = new CustomEvent('telemetryEvent', { detail: { eid: 'INTERACT' } });
      element.dispatchEvent(telemetryEvent);

      expect(onTelemetryEvent).toHaveBeenCalledWith({ eid: 'INTERACT' });
    });

    it('removes previous listeners before attaching new ones', () => {
      const element = document.createElement('div');
      const firstHandler = vi.fn();
      const secondHandler = vi.fn();

      service.attachEventListeners(element, firstHandler);
      service.attachEventListeners(element, secondHandler);

      const event = new CustomEvent('editorEmitter', { detail: { action: 'test' } });
      element.dispatchEvent(event);

      expect(firstHandler).not.toHaveBeenCalled();
      expect(secondHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeEventListeners', () => {
    it('removes attached event listeners', () => {
      const element = document.createElement('div');
      const onEditorEvent = vi.fn();

      service.attachEventListeners(element, onEditorEvent);
      service.removeEventListeners(element);

      const event = new CustomEvent('editorEmitter', { detail: { action: 'test' } });
      element.dispatchEvent(event);

      expect(onEditorEvent).not.toHaveBeenCalled();
    });

    it('handles removal when no listeners are attached', () => {
      const element = document.createElement('div');

      expect(() => service.removeEventListeners(element)).not.toThrow();
    });

    it('removes telemetry listener when present', () => {
      const element = document.createElement('div');
      const onEditorEvent = vi.fn();
      const onTelemetryEvent = vi.fn();

      service.attachEventListeners(element, onEditorEvent, onTelemetryEvent);
      service.removeEventListeners(element);

      const telemetryEvent = new CustomEvent('telemetryEvent', { detail: { eid: 'TEST' } });
      element.dispatchEvent(telemetryEvent);

      expect(onTelemetryEvent).not.toHaveBeenCalled();
    });
  });
});

