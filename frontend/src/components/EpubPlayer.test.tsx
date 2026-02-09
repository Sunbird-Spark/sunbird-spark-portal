import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { EpubPlayer } from './EpubPlayer';
import appCoreService from '../services/AppCoreService';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

// Mock services
vi.mock('../services/AppCoreService', () => ({
  default: {
    getDeviceId: vi.fn(() => Promise.resolve('test-device-id')),
  },
}));

vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getAuthInfo: vi.fn(() => Promise.resolve({
      sid: 'test-session-id',
      uid: 'test-user-id',
      isAuthenticated: true,
    })),
  },
}));

describe('EpubPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Define custom element if not already defined
    if (!customElements.get('sunbird-epub-player')) {
      customElements.define('sunbird-epub-player', class extends HTMLElement {});
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', async () => {
    const { container } = render(
      <EpubPlayer epubUrl="/test.epub" />
    );
    
    await waitFor(() => {
      expect(container.querySelector('sunbird-epub-player')).toBeTruthy();
    });
  });

  it('should show loading state initially', () => {
    const { getByText } = render(
      <EpubPlayer epubUrl="/test.epub" />
    );
    
    expect(getByText('Loading EPUB Player...')).toBeTruthy();
  });

  it('should fetch device ID and auth info on mount', async () => {
    render(<EpubPlayer epubUrl="/test.epub" />);

    await waitFor(() => {
      expect(appCoreService.getDeviceId).toHaveBeenCalled();
      expect(userAuthInfoService.getAuthInfo).toHaveBeenCalledWith('test-device-id');
    });
  });

  it('should create player element with correct config', async () => {
    const { container } = render(
      <EpubPlayer 
        epubUrl="/test.epub" 
        contentName="Test EPUB"
      />
    );

    await waitFor(() => {
      const playerElement = container.querySelector('sunbird-epub-player');
      expect(playerElement).toBeTruthy();
      expect(playerElement?.getAttribute('player-config')).toBeTruthy();
      
      const config = JSON.parse(playerElement?.getAttribute('player-config') || '{}');
      expect(config.metadata.artifactUrl).toBe('/test.epub');
      expect(config.metadata.name).toBe('Test EPUB');
    });
  });

  it('should call onPlayerEvent when player event is triggered', async () => {
    const onPlayerEvent = vi.fn();
    const { container } = render(
      <EpubPlayer 
        epubUrl="/test.epub" 
        onPlayerEvent={onPlayerEvent}
      />
    );

    await waitFor(() => {
      const playerElement = container.querySelector('sunbird-epub-player');
      expect(playerElement).toBeTruthy();
    });

    const playerElement = container.querySelector('sunbird-epub-player');
    
    // Simulate player event
    const mockEvent = new CustomEvent('playerEvent', {
      detail: { eid: 'START', data: { test: 'data' } },
    });
    
    playerElement?.dispatchEvent(mockEvent);

    await waitFor(() => {
      expect(onPlayerEvent).toHaveBeenCalled();
      expect(onPlayerEvent.mock.calls[0]?.[0].type).toBe('START');
    });
  });

  it('should use custom playerConfig when provided', async () => {
    const customConfig = {
      context: {
        mode: 'play' as const,
        partner: [],
        pdata: { id: 'custom', ver: '2.0', pid: 'custom-app' },
        contentId: 'custom-123',
        sid: 'custom-session',
        uid: 'custom-user',
        timeDiff: 0,
        channel: 'custom-channel',
        tags: [],
        did: 'custom-device',
        contextRollup: {},
        objectRollup: {},
        host: 'https://custom.com',
        endpoint: '/custom/telemetry',
      },
      metadata: {
        identifier: 'custom-123',
        name: 'Custom EPUB',
        artifactUrl: '',
        streamingUrl: '',
        compatibilityLevel: 2,
        pkgVersion: 2,
      },
    };

    const { container } = render(
      <EpubPlayer 
        epubUrl="/custom.epub" 
        playerConfig={customConfig}
      />
    );

    await waitFor(() => {
      const playerElement = container.querySelector('sunbird-epub-player');
      expect(playerElement).toBeTruthy();
      
      const config = JSON.parse(playerElement?.getAttribute('player-config') || '{}');
      expect(config.context.contentId).toBe('custom-123');
      expect(config.metadata.artifactUrl).toBe('/custom.epub');
    });
  });

  it('should cleanup on unmount', async () => {
    const { container, unmount } = render(
      <EpubPlayer epubUrl="/test.epub" />
    );

    await waitFor(() => {
      expect(container.querySelector('sunbird-epub-player')).toBeTruthy();
    });

    unmount();

    expect(container.querySelector('sunbird-epub-player')).toBeFalsy();
  });

  it('should use fallback values when auth service fails', async () => {
    vi.mocked(appCoreService.getDeviceId).mockRejectedValueOnce(new Error('Device ID error'));

    const { container } = render(
      <EpubPlayer epubUrl="/test.epub" />
    );

    await waitFor(() => {
      // Player should still be created with fallback values
      const playerElement = container.querySelector('sunbird-epub-player');
      expect(playerElement).toBeTruthy();
      
      const config = JSON.parse(playerElement?.getAttribute('player-config') || '{}');
      // Should use fallback values
      expect(config.context.uid).toBe('anonymous');
      expect(config.context.sid).toBe('anonymous-session');
      expect(config.context.did).toMatch(/^device-\d+$/);
    });
  });
});
