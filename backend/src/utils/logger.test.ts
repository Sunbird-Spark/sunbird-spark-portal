import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import winston from 'winston';

describe('Logger', () => {
  let logger: winston.Logger;

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('../config/env.js', () => ({
      envConfig: { SUNBIRD_PORTAL_LOG_LEVEL: 'info' }
    }));

    const loggerModule = await import('./logger.js');
    logger = loggerModule.default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock('../config/env.js');
  });

  it('should initialize logger with level from envConfig', () => {
    expect(logger.level).toBe('info');
  });

  it('should return the same logger instance (singleton)', async () => {
    const { default: logger2 } = await import('./logger.js');
    expect(logger).toBe(logger2);
  });

  it('should configure a console transport', () => {
    const hasConsoleTransport = logger.transports.some(
      (t) => t instanceof winston.transports.Console
    );
    expect(hasConsoleTransport).toBe(true);
    expect(logger.transports).toHaveLength(1);
  });

  it('should write logs to console transport', async () => {
    const consoleTransport = logger.transports[0] as winston.transports.ConsoleTransportInstance;

    const spy = vi
      .spyOn(consoleTransport, 'log')
      .mockImplementation((_info, callback) => {
        callback?.();
        return true;
      });

    logger.info('Test log message');

    await vi.waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });

    spy.mockRestore();
  });

  it('should format log with timestamp, level and message', async () => {
    const consoleTransport = logger.transports[0] as winston.transports.ConsoleTransportInstance;

    const spy = vi
      .spyOn(consoleTransport, 'log')
      .mockImplementation((info, callback) => {
        const formattedMessage = info[Symbol.for('message')];
        expect(formattedMessage).toMatch(
          /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[info\]: Formatted log test/
        );
        callback?.();
        return true;
      });

    logger.info('Formatted log test');

    await vi.waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });

    spy.mockRestore();
  });

  it('should log unhandledRejection without crashing tests', () => {
    const spy = vi.spyOn(logger, 'error').mockImplementation(() => logger);

    const error = new Error('Unhandled promise rejection');
    process.emit('unhandledRejection', error);

    expect(spy).toHaveBeenCalledWith('Unhandled Rejection', error);

    spy.mockRestore();
  });
});
