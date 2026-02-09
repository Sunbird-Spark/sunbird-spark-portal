import React, { useEffect, useRef, useState } from 'react';
import appCoreService from '../services/AppCoreService';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';
import { EpubPlayerService } from '../services/players/epub';
import type { EpubPlayerConfig } from '../services/players/epub';

interface EpubPlayerProps {
  epubUrl: string;
  contentName?: string;
  playerConfig?: Partial<EpubPlayerConfig>;
  onPlayerEvent?: (event: any) => void;
}

export const EpubPlayer: React.FC<EpubPlayerProps> = ({
  epubUrl,
  contentName = 'EPUB Document',
  playerConfig,
  onPlayerEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerElementRef = useRef<HTMLElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const playerService = new EpubPlayerService();

    const initializePlayer = async () => {
      if (!containerRef.current) {
        return;
      }

      try {
        // Get device ID and session ID from services
        let deviceId = 'device-' + Date.now();
        let sessionId = 'anonymous-session';
        let userId = 'anonymous';

        try {
          deviceId = await appCoreService.getDeviceId();
          const authInfo = await userAuthInfoService.getAuthInfo(deviceId);
          sessionId = authInfo?.sid || sessionId;
          userId = authInfo?.uid || userId;
        } catch (authError) {
          // Auth service failed, continue with fallback values
          console.warn('Auth service unavailable, using fallback values');
        }

        if (!mounted) return;

        // Create configuration object
        let config: EpubPlayerConfig;
        
        if (playerConfig && Object.keys(playerConfig).length > 0) {
          // Use provided config and merge with URL
          config = EpubPlayerService.mergeConfigWithUrl(playerConfig, epubUrl);
        } else {
          // Create default config
          config = EpubPlayerService.createDefaultConfig(
            'epub-content-' + Date.now(),
            contentName,
            epubUrl,
            userId,
            sessionId
          );
          
          // Update device ID
          config.context.did = deviceId;
        }

        // Create player element via service
        const epubElement = playerService.createElement(config);

        // Attach event listeners via service
        playerService.attachEventListeners(epubElement, (event) => {
          if (onPlayerEvent) onPlayerEvent(event);
        });

        // Store reference to player element
        playerElementRef.current = epubElement;

        // Append to container
        if (containerRef.current && mounted) {
          containerRef.current.appendChild(epubElement);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('EPUB Player initialization failed:', error);
        if (mounted) {
          setIsLoading(false);
        }
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
  }, [epubUrl, contentName, playerConfig, onPlayerEvent]);

  return (
    <div ref={containerRef} className="epub-player-container">
      {isLoading && (
        <div className="epub-player-loading">
          Loading EPUB Player...
        </div>
      )}
    </div>
  );
};
