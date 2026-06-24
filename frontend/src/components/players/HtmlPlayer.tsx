import React from 'react';

interface HtmlPlayerMetadata {
  identifier: string;
  name: string;
  artifactUrl: string;
  [key: string]: any;
}

interface HtmlPlayerProps {
  metadata: HtmlPlayerMetadata;
  mode?: string;
  cdata?: any[];
  contextRollup?: Record<string, string>;
  objectRollup?: Record<string, string>;
  onPlayerEvent?: (event: any) => void;
  onTelemetryEvent?: (event: any) => void;
}

export const HtmlPlayer: React.FC<HtmlPlayerProps> = ({ metadata }) => {
  return (
    <iframe
      src={metadata.artifactUrl}
      title={metadata.name}
      className="content-player-embed border-0"
      allow="fullscreen"
    />
  );
};
