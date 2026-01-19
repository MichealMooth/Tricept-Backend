import winston from 'winston';

const { combine, timestamp, colorize, printf, splat, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp(),
  splat(),
  printf(({ level, message, timestamp, ...meta }) => {
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${rest}`;
  })
);

/**
 * Audit log format for DSGVO compliance.
 * Structured JSON format for machine parsing and analysis.
 */
const auditFormat = combine(
  timestamp(),
  printf(({ timestamp, ...meta }) => {
    return JSON.stringify({
      timestamp,
      ...meta,
    });
  })
);

/**
 * Main application logger.
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? combine(timestamp(), json()) : devFormat,
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
});

/**
 * Audit logger for DSGVO compliance tracking.
 *
 * STUB: Currently logs to console. In production, configure to:
 * - Write to separate audit log file
 * - Send to centralized logging system (ELK, Splunk, etc.)
 * - Store in database for retention policy enforcement
 *
 * Usage:
 * ```ts
 * auditLogger.info('User data accessed', { userId, resource, action });
 * ```
 */
export const auditLogger = winston.createLogger({
  level: 'info',
  format: auditFormat,
  defaultMeta: { service: 'audit' },
  transports: [
    new winston.transports.Console({
      handleExceptions: false,
    }),
    // STUB: Add file transport in production
    // new winston.transports.File({
    //   filename: 'logs/audit.log',
    //   level: 'info',
    // }),
  ],
  exitOnError: false,
});
