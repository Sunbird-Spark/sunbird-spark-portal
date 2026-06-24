import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HtmlPlayer } from './HtmlPlayer';

const metadata = {
  identifier: 'do_123',
  name: 'HTML Content',
  artifactUrl: 'https://www.w3schools.com/html/tryhtml_basic.htm',
};

describe('HtmlPlayer', () => {
  it('renders an iframe with src set to artifactUrl', () => {
    render(<HtmlPlayer metadata={metadata} />);
    const iframe = screen.getByTitle('HTML Content');
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe).toHaveAttribute('src', metadata.artifactUrl);
  });

  it('sets iframe title to metadata.name', () => {
    render(<HtmlPlayer metadata={metadata} />);
    expect(screen.getByTitle('HTML Content')).toBeInTheDocument();
  });

  it('accepts optional props without errors', () => {
    render(
      <HtmlPlayer
        metadata={metadata}
        mode="play"
        cdata={[]}
        contextRollup={{ l1: 'channel1' }}
        objectRollup={{}}
        onPlayerEvent={() => {}}
        onTelemetryEvent={() => {}}
      />
    );
    expect(screen.getByTitle('HTML Content')).toBeInTheDocument();
  });

  it('fires START then END telemetry events when iframe loads', () => {
    const onTelemetryEvent = vi.fn();
    render(<HtmlPlayer metadata={metadata} onTelemetryEvent={onTelemetryEvent} />);
    fireEvent.load(screen.getByTitle('HTML Content'));
    expect(onTelemetryEvent).toHaveBeenCalledTimes(2);
    expect(onTelemetryEvent).toHaveBeenNthCalledWith(1, { eid: 'START' });
    expect(onTelemetryEvent).toHaveBeenNthCalledWith(2, { eid: 'END', edata: { summary: [{ progress: 0 }] } });
  });

  it('does not throw when onTelemetryEvent is not provided and iframe loads', () => {
    render(<HtmlPlayer metadata={metadata} />);
    expect(() => fireEvent.load(screen.getByTitle('HTML Content'))).not.toThrow();
  });
});
