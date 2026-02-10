import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { EpubPlayer } from './EpubPlayer';

// Mock player config helper
const createMockPlayerConfig = (epubUrl: string, contentName = 'EPUB Document') => ({
  context: {
    mode: 'play',
    authToken: '',
    sid: '7283cf2e-d215-9944-b0c5-269489c6fa56',
    did: '3c0a3724311fe944dec5df559cc4e006',
    uid: 'anonymous',
    channel: '505c7c48ac6dc1edc9b08f21db5a571e',
    pdata: {
      id: 'sunbird.portal',
      ver: '3.2.12',
      pid: 'sunbird-portal.contentplayer',
    },
    tags: [''],
    timeDiff: 0,
    host: '',
    endpoint: '',
    userData: {
      firstName: 'Test',
      lastName: 'User',
    },
  },
  contextRollup: {
    l1: '505c7c48ac6dc1edc9b08f21db5a571d',
  },
  cdata: [],
  objectRollup: {},
  config: {},
  metadata: {
    compatibilityLevel: 4,
    artifactUrl: epubUrl,
    contentType: 'FocusSpot',
    identifier: 'test-epub-id',
    audience: ['Teacher'],
    visibility: 'Default',
    mediaType: 'content',
    osId: 'org.ekstep.quiz.app',
    languageCode: ['en'],
    license: 'CC BY 4.0',
    name: contentName,
    status: 'Live',
    code: '43e68089-997e-49a4-902a-6262e5654515',
    description: 'Test EPUB',
    streamingUrl: epubUrl,
    createdOn: '2019-12-16T07:59:53.154+0000',
    copyrightYear: 2019,
    additionalCategories: ['Focus Spot'],
    lastUpdatedOn: '2019-12-16T11:52:56.405+0000',
    creator: 'Test Creator',
    pkgVersion: 1,
    versionKey: '1576497176405',
    framework: 'tn_k-12_5',
    createdBy: 'test-user-id',
    resourceType: 'Read',
    licenseDetails: {
      name: 'CC BY 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/legalcode',
      description: 'For details see below:',
    },
  },
});

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
    const config = createMockPlayerConfig('/test.epub');
    const { container } = render(
      <EpubPlayer 
        context={config.context}
        config={config.config}
        metadata={config.metadata}
      />
    );
    
    await waitFor(() => {
      expect(container.querySelector('sunbird-epub-player')).toBeTruthy();
    });
  });

  it('should show loading state initially', () => {
    const config = createMockPlayerConfig('/test.epub');
    const { container } = render(
      <EpubPlayer 
        context={config.context}
        config={config.config}
        metadata={config.metadata}
      />
    );
    
    // Check that the player container exists
    expect(container.querySelector('.epub-player-container')).toBeTruthy();
  });

  it('should create player element with correct config', async () => {
    const config = createMockPlayerConfig('/test.epub', 'Test EPUB');
    const { container } = render(
      <EpubPlayer 
        context={config.context}
        config={config.config}
        metadata={config.metadata}
      />
    );

    await waitFor(() => {
      const playerElement = container.querySelector('sunbird-epub-player');
      expect(playerElement).toBeTruthy();
      expect(playerElement?.getAttribute('player-config')).toBeTruthy();
      
      const playerConfig = JSON.parse(playerElement?.getAttribute('player-config') || '{}');
      expect(playerConfig.context.mode).toBe('play');
      expect(playerConfig.context.uid).toBe('anonymous');
    });
  });

  it('should call onPlayerEvent when player event is triggered', async () => {
    const config = createMockPlayerConfig('/test.epub');
    const onPlayerEvent = vi.fn();
    const { container } = render(
      <EpubPlayer 
        context={config.context}
        config={config.config}
        metadata={config.metadata}
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

  it('should cleanup on unmount', async () => {
    const config = createMockPlayerConfig('/test.epub');
    const { container, unmount } = render(
      <EpubPlayer 
        context={config.context}
        config={config.config}
        metadata={config.metadata}
      />
    );

    await waitFor(() => {
      expect(container.querySelector('sunbird-epub-player')).toBeTruthy();
    });

    unmount();

    expect(container.querySelector('sunbird-epub-player')).toBeFalsy();
  });
});
