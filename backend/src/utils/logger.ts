import winston from 'winston';
import { envConfig } from '../config/env.js';

const { combine, timestamp, printf, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
    if (stack) {
        return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
});

export const logger: winston.Logger = winston.createLogger({
    level: envConfig.SUNBIRD_PORTAL_LOG_LEVEL,
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new winston.transports.Console({
            format: combine(
                logFormat
            )
        })
    ]
});

process.on('unhandledRejection', (reason: Error | string | object) => {
    logger.error('Unhandled Rejection', reason instanceof Error ? reason : { message: String(reason) });
});

process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception', err);
    // Don't exit in test environment to prevent worker crashes
    if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
        process.exit(1);
    }
});

export default logger;