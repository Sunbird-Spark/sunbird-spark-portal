import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PdfPlayer from './PdfPlayer';
import appCoreService from '../../../services/AppCoreService';
import userAuthInfoService from '../../../services/userAuthInfoService/userAuthInfoService';
import { PdfPlayerService } from '../../../services/players/pdf/PdfPlayerService';

// Mock dependencies
vi.mock('../../../services/AppCoreService');
vi.mock('../../../services/userAuthInfoService/userAuthInfoService');
vi.mock('../../../services/players/pdf/PdfPlayerService', () => {
    return {
        PdfPlayerService: vi.fn()
    };
});

describe('PdfPlayer Component', () => {
    const mockPdfUrl = 'https://example.com/sample.pdf';
    const mockContentName = 'Sample PDF';

    // Mock implementations for ContentPlayerService methods
    const mockCreateElement = vi.fn();
    const mockAttachEventListeners = vi.fn();
    const mockRemoveEventListeners = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup Player Service mock
        (PdfPlayerService as any).mockImplementation(function (this: any) {
            return {
                createElement: mockCreateElement,
                attachEventListeners: mockAttachEventListeners,
                removeEventListeners: mockRemoveEventListeners
            };
        });

        // Setup default service responses
        (appCoreService.getDeviceId as any).mockResolvedValue('device-123');
        (userAuthInfoService.getAuthInfo as any).mockResolvedValue({
            sid: 'session-123',
            uid: 'user-123',
            isAuthenticated: true
        });

        // Setup createElement to return a real DOM element
        mockCreateElement.mockReturnValue(document.createElement('div'));
    });

    it('should render loading state initially', () => {
        render(<PdfPlayer pdfUrl={mockPdfUrl} />);
        expect(screen.getByText('Loading PDF Player...')).toBeInTheDocument();
    });

    it('should initialize player and remove loading state', async () => {
        render(<PdfPlayer pdfUrl={mockPdfUrl} contentName={mockContentName} />);

        await waitFor(() => {
            expect(appCoreService.getDeviceId).toHaveBeenCalled();
            expect(userAuthInfoService.getAuthInfo).toHaveBeenCalledWith('device-123');
            expect(mockCreateElement).toHaveBeenCalled();
            expect(screen.queryByText('Loading PDF Player...')).not.toBeInTheDocument();
        });

        // Verify config passed to createElement
        const configArg = mockCreateElement.mock.calls[0]?.[0];
        expect(configArg).toMatchObject({
            contentName: mockContentName,
            contentUrl: mockPdfUrl,
            did: 'device-123',
            sid: 'session-123',
            userId: 'user-123'
        });
    });

    it('should handle anonymous user configuration', async () => {
        // Mock anonymous response (null uid/sid)
        (userAuthInfoService.getAuthInfo as any).mockResolvedValue(null);

        render(<PdfPlayer pdfUrl={mockPdfUrl} />);

        await waitFor(() => {
            expect(mockCreateElement).toHaveBeenCalled();
        });

        const configArg = mockCreateElement.mock.calls[0]?.[0];
        expect(configArg).toMatchObject({
            sid: 'anonymous-session',
            userId: 'anonymous'
        });
    });

    it('should attach event listeners properly', async () => {
        const onPlayerEvent = vi.fn();
        const onTelemetryEvent = vi.fn();

        render(
            <PdfPlayer
                pdfUrl={mockPdfUrl}
                onPlayerEvent={onPlayerEvent}
                onTelemetryEvent={onTelemetryEvent}
            />
        );

        await waitFor(() => {
            expect(mockAttachEventListeners).toHaveBeenCalled();
        });

        // Verify handlers are passed
        const calls = mockAttachEventListeners.mock.calls[0]!;
        expect(calls).toBeDefined();
        const [element, playerHandler, telemetryHandler] = calls;
        expect(element).toBeInstanceOf(HTMLElement);
        expect(typeof playerHandler).toBe('function');
        expect(typeof telemetryHandler).toBe('function');

        // Test the handlers wrapping
        playerHandler('event-1');
        expect(onPlayerEvent).toHaveBeenCalledWith('event-1');

        telemetryHandler('event-2');
        expect(onTelemetryEvent).toHaveBeenCalledWith('event-2');
    });

    it('should cleanup on unmount', async () => {
        const { unmount } = render(<PdfPlayer pdfUrl={mockPdfUrl} />);

        await waitFor(() => {
            expect(mockCreateElement).toHaveBeenCalled();
        });

        unmount();

        expect(mockRemoveEventListeners).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
        // Simulate error
        (appCoreService.getDeviceId as any).mockRejectedValue(new Error('Init failed'));

        render(<PdfPlayer pdfUrl={mockPdfUrl} />);

        // Should stop loading eventually (or stay loading? The catch block sets isLoading(false))
        await waitFor(() => {
            expect(screen.queryByText('Loading PDF Player...')).not.toBeInTheDocument();
        });

        // Should NOT have created the player
        expect(mockCreateElement).not.toHaveBeenCalled();
    });

    it('should not initialize if component is unmounted during async operations', async () => {
        // Delay the async operation to allow unmount
        (appCoreService.getDeviceId as any).mockReturnValue(new Promise(resolve => setTimeout(() => resolve('d1'), 100)));

        const { unmount } = render(<PdfPlayer pdfUrl={mockPdfUrl} />);

        unmount();

        // Wait for potential async completion
        await new Promise(resolve => setTimeout(resolve, 150));

        expect(mockCreateElement).not.toHaveBeenCalled();
    });
});
