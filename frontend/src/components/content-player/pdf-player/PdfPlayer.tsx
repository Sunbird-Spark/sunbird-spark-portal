import React, { useEffect, useRef, useState } from 'react';
import appCoreService from '../../../services/AppCoreService';
import userAuthInfoService from '../../../services/userAuthInfoService/userAuthInfoService';
import { PdfPlayerService } from '../../../services/players/pdf/PdfPlayerService';
import { PdfPlayerConfig } from '../../../services/players/types';

interface PdfPlayerProps {
    pdfUrl: string;
    contentName?: string;
    onPlayerEvent?: (event: any) => void;
    onTelemetryEvent?: (event: any) => void;
    showShare?: boolean;
    showDownload?: boolean;
    showPrint?: boolean;
}

const PdfPlayer: React.FC<PdfPlayerProps> = ({
    pdfUrl,
    contentName = 'PDF Document',
    onPlayerEvent,
    onTelemetryEvent,
    showShare = true,
    showDownload = true,
    showPrint = true,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerElementRef = useRef<HTMLElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const playerService = new PdfPlayerService(); // Instantiated PdfPlayerService

        const initializePlayer = async () => {
            if (!containerRef.current) {
                return;
            }

            try {
                // Get device ID and session ID from services
                const deviceId = await appCoreService.getDeviceId();
                const authInfo = await userAuthInfoService.getAuthInfo(deviceId);
                const sessionId = authInfo?.sid || 'anonymous-session';
                const userId = authInfo?.uid || 'anonymous';

                if (!mounted) return;

                // Create configuration object
                const config: PdfPlayerConfig = {
                    contentId: 'pdf-content-' + Date.now(),
                    contentName: contentName,
                    contentUrl: pdfUrl,
                    streamingUrl: pdfUrl,
                    userId: userId,
                    sid: sessionId,
                    did: deviceId,
                    metadata: {
                        mimeType: 'application/pdf',
                        contentType: 'Resource',
                        primaryCategory: 'Learning Resource',
                        status: 'Live',
                        license: 'CC BY 4.0',
                        mediaType: 'content',
                        osId: 'org.sunbird.quiz.app',
                        languageCode: ['en'],
                        visibility: 'Default',
                        audience: ['Student'],
                        resourceType: 'Read',
                    },
                    context: {
                        channel: 'sunbird-portal',
                        tags: ['pdf'],
                        contextRollup: { l1: 'sunbird-portal' },
                        objectRollup: {},
                        userData: { firstName: 'Guest', lastName: '' }
                    }
                };

                const options = {
                    showShare,
                    showDownload,
                    showPrint,
                    showExit: false
                };

                const pdfElement = playerService.createElement(config, options); // Used service to create element

                // Attach event listeners via service
                playerService.attachEventListeners(
                    pdfElement,
                    (event) => {
                        if (onPlayerEvent) onPlayerEvent(event);
                    },
                    (event) => {
                        if (onTelemetryEvent) onTelemetryEvent(event);
                    }
                );

                // Store reference to player element
                playerElementRef.current = pdfElement;

                // Append to container
                if (containerRef.current && mounted) {
                    containerRef.current.appendChild(pdfElement);
                    setIsLoading(false);
                }
            } catch (error) {
                setIsLoading(false);
            }
        };

        initializePlayer();

        // Cleanup function
        return () => {
            mounted = false;

            if (playerElementRef.current) {
                // Remove listeners via service
                playerService.removeEventListeners(playerElementRef.current);

                // Remove from DOM if still attached
                if (playerElementRef.current.parentNode) {
                    playerElementRef.current.parentNode.removeChild(playerElementRef.current);
                }

                playerElementRef.current = null;
            }
        };
    }, [pdfUrl, contentName, onPlayerEvent, onTelemetryEvent, showShare, showDownload, showPrint]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                display: 'block',
                position: 'relative',
            }}
        >
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: '16px',
                    backgroundColor: '#f9f9f9',
                }}>
                    Loading PDF Player...
                </div>
            )}
        </div>
    );
};

export default PdfPlayer;

