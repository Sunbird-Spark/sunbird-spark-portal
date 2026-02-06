import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentPlayerService } from './ContentPlayerService';
import { PdfPlayerConfig, PdfPlayerEvent, PdfTelemetryEvent } from '../types';

describe('ContentPlayerService', () => {
    let service: ContentPlayerService;
    const mockConfig: PdfPlayerConfig = {
        contentId: 'dom_1',
        contentName: 'Test PDF',
        contentUrl: 'http://example.com/test.pdf',
        sid: 'session-1',
        did: 'device-1',
        userId: 'user-1'
    };

    beforeEach(() => {
        service = new ContentPlayerService();
    });
    describe('createElement', () => {
        it('should create a sunbird-pdf-player element with correct attributes', () => {
            const element = service.createElement(mockConfig);

            expect(element.tagName.toLowerCase()).toBe('sunbird-pdf-player');
            expect(element.getAttribute('data-player-id')).toBe(mockConfig.contentId);

            const playerConfigAttr = element.getAttribute('player-config');
            expect(playerConfigAttr).toBeTruthy();

            const parsedConfig = JSON.parse(playerConfigAttr!);
            expect(parsedConfig.metadata.identifier).toBe(mockConfig.contentId);
            expect(parsedConfig.context.sid).toBe(mockConfig.sid);
        });
        it('should merge custom options correctly', () => {
            const element = service.createElement(mockConfig, { showShare: false });
            const parsedConfig = JSON.parse(element.getAttribute('player-config')!);
            expect(parsedConfig.config.sideMenu.showShare).toBe(false);
            // Default should be true for others
            expect(parsedConfig.config.sideMenu.showPrint).toBe(true);
        });
    });

    describe('Event Listeners', () => {
        let element: HTMLElement;

        beforeEach(() => {
            element = document.createElement('div');
            // Mock addEventListener to capture handlers if needed, 
            // but JSDOM implementation is usually sufficient for dispatchEvent
        });

        it('should attach and fire player events', () => {
            const onPlayerEvent = vi.fn();
            service.attachEventListeners(element, onPlayerEvent);

            const testEvent = new CustomEvent('playerEvent', { detail: { type: 'LOADED' } });
            element.dispatchEvent(testEvent);

            expect(onPlayerEvent).toHaveBeenCalled();
            const calledArg = onPlayerEvent.mock.calls[0]?.[0];
            expect(calledArg.type).toBe('LOADED');
            expect(calledArg.playerId).toBe('pdf-player'); // Default when attribute missing
        });

        it('should attach and fire telemetry events', () => {
            const onTelemetryEvent = vi.fn();
            service.attachEventListeners(element, undefined, onTelemetryEvent);

            const testEvent = new CustomEvent('telemetryEvent', { detail: { updated: true } });
            element.dispatchEvent(testEvent);

            expect(onTelemetryEvent).toHaveBeenCalled();
        });

        it('should remove event listeners', () => {
            const onPlayerEvent = vi.fn();
            service.attachEventListeners(element, onPlayerEvent);

            service.removeEventListeners(element);

            const testEvent = new CustomEvent('playerEvent', { detail: { type: 'LOADED' } });
            element.dispatchEvent(testEvent);

            expect(onPlayerEvent).not.toHaveBeenCalled();
        });

        it('should handle removing non-existent listeners gracefully', () => {
            expect(() => service.removeEventListeners(element)).not.toThrow();
        });
    });

    describe('getDefaultConfigTemplate', () => {
        it('should return a valid partial config', () => {
            const template = service.getDefaultConfigTemplate();
            expect(template.context?.uid).toBe('anonymous');
            expect(template.context?.host).toBe(window.location.origin);
        });
    });
});
