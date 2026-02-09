import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PdfPlayerService } from './PdfPlayerService';
import { PdfPlayerConfig, PdfPlayerOptions } from '../types';

describe('PdfPlayerService', () => {
    let service: PdfPlayerService;
    let mockElement: HTMLElement;

    beforeEach(() => {
        service = new PdfPlayerService();
        mockElement = document.createElement('div');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getDefaultOptions', () => {
        it('should return default options', () => {
            const options = service.getDefaultOptions();

            expect(options).toEqual({
                showShare: true,
                showDownload: true,
                showPrint: true,
                showReplay: true,
                showExit: false,
            });
        });

        it('should return a new object each time', () => {
            const options1 = service.getDefaultOptions();
            const options2 = service.getDefaultOptions();

            expect(options1).not.toBe(options2);
            expect(options1).toEqual(options2);
        });
    });

    describe('createElement', () => {
        const mockConfig: PdfPlayerConfig = {
            contentId: 'test-content-123',
            contentName: 'Test PDF',
            contentUrl: 'https://example.com/test.pdf',
            userId: 'user-123',
            sid: 'session-123',
            did: 'device-123',
        };

        it('should create sunbird-pdf-player element', () => {
            const element = service.createElement(mockConfig);

            expect(element.tagName.toLowerCase()).toBe('sunbird-pdf-player');
        });

        it('should set player-config attribute with stringified config', () => {
            const element = service.createElement(mockConfig);
            const configAttr = element.getAttribute('player-config');

            expect(configAttr).toBeTruthy();
            const parsedConfig = JSON.parse(configAttr!);
            expect(parsedConfig.metadata.identifier).toBe('test-content-123');
            expect(parsedConfig.metadata.name).toBe('Test PDF');
        });

        it('should set data-player-id attribute', () => {
            const element = service.createElement(mockConfig);

            expect(element.getAttribute('data-player-id')).toBe('test-content-123');
        });

        it('should merge custom options with defaults', () => {
            const customOptions: PdfPlayerOptions = {
                showShare: false,
                showDownload: false,
            };

            const element = service.createElement(mockConfig, customOptions);
            const configAttr = element.getAttribute('player-config');
            const parsedConfig = JSON.parse(configAttr!);

            expect(parsedConfig.config.sideMenu.showShare).toBe(false);
            expect(parsedConfig.config.sideMenu.showDownload).toBe(false);
            expect(parsedConfig.config.sideMenu.showPrint).toBe(true); // default
            expect(parsedConfig.config.sideMenu.showReplay).toBe(true); // default
        });

        it('should include session and device IDs in context', () => {
            const element = service.createElement(mockConfig);
            const configAttr = element.getAttribute('player-config');
            const parsedConfig = JSON.parse(configAttr!);

            expect(parsedConfig.context.sid).toBe('session-123');
            expect(parsedConfig.context.did).toBe('device-123');
            expect(parsedConfig.context.uid).toBe('user-123');
        });

        it('should use empty string for missing session/device IDs', () => {
            const configWithoutIds: PdfPlayerConfig = {
                contentId: 'test-content',
                contentName: 'Test PDF',
                contentUrl: 'https://example.com/test.pdf',
            };

            const element = service.createElement(configWithoutIds);
            const configAttr = element.getAttribute('player-config');
            const parsedConfig = JSON.parse(configAttr!);

            expect(parsedConfig.context.sid).toBe('');
            expect(parsedConfig.context.did).toBe('');
            expect(parsedConfig.context.uid).toBe('anonymous');
        });

        it('should set streamingUrl from contentUrl if not provided', () => {
            const element = service.createElement(mockConfig);
            const configAttr = element.getAttribute('player-config');
            const parsedConfig = JSON.parse(configAttr!);

            expect(parsedConfig.metadata.streamingUrl).toBe('https://example.com/test.pdf');
        });

        it('should use provided streamingUrl if available', () => {
            const configWithStreaming: PdfPlayerConfig = {
                ...mockConfig,
                streamingUrl: 'https://cdn.example.com/stream.pdf',
            };

            const element = service.createElement(configWithStreaming);
            const configAttr = element.getAttribute('player-config');
            const parsedConfig = JSON.parse(configAttr!);

            expect(parsedConfig.metadata.streamingUrl).toBe('https://cdn.example.com/stream.pdf');
        });

        it('should include custom metadata if provided', () => {
            const configWithMetadata: PdfPlayerConfig = {
                ...mockConfig,
                metadata: {
                    mimeType: 'application/pdf',
                    contentType: 'Resource',
                    customField: 'customValue',
                },
            };

            const element = service.createElement(configWithMetadata);
            const configAttr = element.getAttribute('player-config');
            const parsedConfig = JSON.parse(configAttr!);

            expect(parsedConfig.metadata.mimeType).toBe('application/pdf');
            expect(parsedConfig.metadata.contentType).toBe('Resource');
            expect(parsedConfig.metadata.customField).toBe('customValue');
        });

        it('should include custom context if provided', () => {
            const configWithContext: PdfPlayerConfig = {
                ...mockConfig,
                context: {
                    channel: 'custom-channel',
                    tags: ['tag1', 'tag2'],
                },
            };

            const element = service.createElement(configWithContext);
            const configAttr = element.getAttribute('player-config');
            const parsedConfig = JSON.parse(configAttr!);

            expect(parsedConfig.context.channel).toBe('custom-channel');
            expect(parsedConfig.context.tags).toEqual(['tag1', 'tag2']);
        });
    });

    describe('attachEventListeners', () => {
        it('should attach playerEvent listener', () => {
            const onPlayerEvent = vi.fn();
            const element = document.createElement('div');
            element.setAttribute('data-player-id', 'test-player');

            service.attachEventListeners(element, onPlayerEvent);

            const event = new CustomEvent('playerEvent', {
                detail: { type: 'play', data: 'test' },
            });
            element.dispatchEvent(event);

            expect(onPlayerEvent).toHaveBeenCalledTimes(1);
            expect(onPlayerEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'play',
                    data: 'test',
                    playerId: 'test-player',
                    timestamp: expect.any(Number),
                })
            );
        });

        it('should attach telemetryEvent listener', () => {
            const onTelemetryEvent = vi.fn();
            const element = document.createElement('div');
            element.setAttribute('data-player-id', 'test-player');

            service.attachEventListeners(element, undefined, onTelemetryEvent);

            const event = new CustomEvent('telemetryEvent', {
                detail: { eid: 'START', data: 'telemetry' },
            });
            element.dispatchEvent(event);

            expect(onTelemetryEvent).toHaveBeenCalledTimes(1);
            expect(onTelemetryEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    eid: 'START',
                    data: 'telemetry',
                    playerId: 'test-player',
                    timestamp: expect.any(Number),
                })
            );
        });

        it('should use default playerId if not set', () => {
            const onPlayerEvent = vi.fn();
            const element = document.createElement('div');

            service.attachEventListeners(element, onPlayerEvent);

            const event = new CustomEvent('playerEvent', {
                detail: { type: 'play' },
            });
            element.dispatchEvent(event);

            expect(onPlayerEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    playerId: 'pdf-player',
                })
            );
        });

        it('should not throw if callbacks are not provided', () => {
            const element = document.createElement('div');

            expect(() => {
                service.attachEventListeners(element);
            }).not.toThrow();

            const event = new CustomEvent('playerEvent', { detail: {} });
            expect(() => {
                element.dispatchEvent(event);
            }).not.toThrow();
        });

        it('should handle multiple events', () => {
            const onPlayerEvent = vi.fn();
            const element = document.createElement('div');
            element.setAttribute('data-player-id', 'test-player');

            service.attachEventListeners(element, onPlayerEvent);

            element.dispatchEvent(new CustomEvent('playerEvent', { detail: { type: 'play' } }));
            element.dispatchEvent(new CustomEvent('playerEvent', { detail: { type: 'pause' } }));
            element.dispatchEvent(new CustomEvent('playerEvent', { detail: { type: 'end' } }));

            expect(onPlayerEvent).toHaveBeenCalledTimes(3);
        });
    });

    describe('removeEventListeners', () => {
        it('should remove attached event listeners', () => {
            const onPlayerEvent = vi.fn();
            const onTelemetryEvent = vi.fn();
            const element = document.createElement('div');

            service.attachEventListeners(element, onPlayerEvent, onTelemetryEvent);
            service.removeEventListeners(element);

            element.dispatchEvent(new CustomEvent('playerEvent', { detail: {} }));
            element.dispatchEvent(new CustomEvent('telemetryEvent', { detail: {} }));

            expect(onPlayerEvent).not.toHaveBeenCalled();
            expect(onTelemetryEvent).not.toHaveBeenCalled();
        });

        it('should not throw if element has no listeners', () => {
            const element = document.createElement('div');

            expect(() => {
                service.removeEventListeners(element);
            }).not.toThrow();
        });

        it('should handle multiple remove calls', () => {
            const element = document.createElement('div');
            service.attachEventListeners(element, vi.fn());

            expect(() => {
                service.removeEventListeners(element);
                service.removeEventListeners(element);
            }).not.toThrow();
        });
    });

    describe('getDefaultConfigTemplate', () => {
        it('should return default configuration template', () => {
            const template = service.getDefaultConfigTemplate();

            expect(template.context).toBeDefined();
            expect(template.config).toBeDefined();
            expect(template.metadata).toBeDefined();
        });

        it('should have correct context structure', () => {
            const template = service.getDefaultConfigTemplate();

            expect(template.context).toMatchObject({
                mode: 'play',
                authToken: '',
                channel: 'portal',
                sid: '',
                did: '',
                uid: 'anonymous',
            });
        });

        it('should have correct config structure', () => {
            const template = service.getDefaultConfigTemplate();

            expect(template.config?.sideMenu).toEqual({
                showShare: true,
                showDownload: true,
                showPrint: true,
                showReplay: true,
                showExit: false,
            });
        });

        it('should have correct metadata structure', () => {
            const template = service.getDefaultConfigTemplate();

            expect(template.metadata).toMatchObject({
                compatibilityLevel: 4,
                pkgVersion: 1,
                identifier: '',
                name: '',
                artifactUrl: '',
            });
        });
    });
});
