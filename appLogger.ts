/**
 * appLogger.ts
 *
 * Winston-based application logger.
 * - Development: colourised console output
 * - Production:  JSON logs written to rotating daily files
 *
 * Usage:
 *   import { appLogger } from './appLogger';
 *   appLogger.info('Server started', { port: 3001 });
 *   appLogger.error('Unhandled error', { err: error.message });
 */

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

// --------------------------------------------------------------------------
// Log levels (ascending severity — error is most critical)
// --------------------------------------------------------------------------
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
} as const;

// --------------------------------------------------------------------------
// Colours for development console
// --------------------------------------------------------------------------
winston.addColors({
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
});

// --------------------------------------------------------------------------
// Determine the active log level from the environment
// --------------------------------------------------------------------------
function resolveLogLevel(): string {
  if (process.env.NODE_ENV === "development") return "debug";
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  return "warn";
}

// --------------------------------------------------------------------------
// Shared timestamp format
// --------------------------------------------------------------------------
const timestampFormat = winston.format.timestamp({
  format: "YYYY-MM-DD HH:mm:ss.SSS",
});

// --------------------------------------------------------------------------
// Development format — human-readable, colourised
// --------------------------------------------------------------------------
const devConsoleFormat = winston.format.combine(
  timestampFormat,
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n  ${JSON.stringify(meta, null, 2)}`
      : "";
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// --------------------------------------------------------------------------
// Production format — structured JSON (easy to ingest by log aggregators)
// --------------------------------------------------------------------------
const jsonFormat = winston.format.combine(
  timestampFormat,
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// --------------------------------------------------------------------------
// Transports
// --------------------------------------------------------------------------
const logsDir = path.join(__dirname, "..", "logs");

/** Write all log levels to a daily-rotating combined log file */
const combinedFileTransport = new DailyRotateFile({
  dirname: logsDir,
  filename: "combined-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxFiles: "14d", // Keep 14 days of combined logs
  format: jsonFormat,
});

/** Write only errors to a separate error log */
const errorFileTransport = new DailyRotateFile({
  dirname: logsDir,
  filename: "error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  level: "error",
  zippedArchive: true,
  maxFiles: "30d", // Retain error logs longer
  format: jsonFormat,
});

// --------------------------------------------------------------------------
// Logger instance
// --------------------------------------------------------------------------
export const appLogger = winston.createLogger({
  levels: LOG_LEVELS,
  level: resolveLogLevel(),
  transports: [
    // Always write to files
    combinedFileTransport,
    errorFileTransport,

    // Console output format depends on environment
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === "production" ? jsonFormat : devConsoleFormat,
    }),
  ],
  // Do not exit on uncaught exceptions inside Winston itself
  exitOnError: false,
});

// --------------------------------------------------------------------------
// Handle uncaught exceptions & unhandled promise rejections via Winston
// --------------------------------------------------------------------------
appLogger.exceptions.handle(
  new winston.transports.File({
    dirname: logsDir,
    filename: "exceptions.log",
    format: jsonFormat,
  })
);

appLogger.rejections.handle(
  new winston.transports.File({
    dirname: logsDir,
    filename: "rejections.log",
    format: jsonFormat,
  })
);
