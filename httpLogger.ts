/**
 * httpLogger.ts
 *
 * Morgan-based HTTP access logger middleware.
 * Streams every request/response pair into both:
 *   - Winston's appLogger (for unified log management)
 *   - A dedicated access.log file via DailyRotateFile
 *
 * Usage:
 *   import { httpLogger } from './httpLogger';
 *   app.use(httpLogger);
 */

import morgan, { StreamOptions } from "morgan";
import { Request, Response } from "express";
import DailyRotateFile from "winston-daily-rotate-file";
import winston from "winston";
import path from "path";

// --------------------------------------------------------------------------
// Access log file transport (separate from the app logs)
// --------------------------------------------------------------------------
const logsDir = path.join(__dirname, "..", "logs");

const accessFileTransport = new DailyRotateFile({
  dirname: logsDir,
  filename: "access-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxFiles: "14d",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.json()
  ),
});

/** Dedicated logger for HTTP access events */
const accessLogger = winston.createLogger({
  level: "http",
  transports: [accessFileTransport],
});

// --------------------------------------------------------------------------
// Stream adapter — bridges Morgan → Winston
// --------------------------------------------------------------------------
const morganStream: StreamOptions = {
  write: (message: string) => {
    // Morgan appends a trailing newline; strip it before logging
    accessLogger.http(message.trim());
  },
};

// --------------------------------------------------------------------------
// Morgan token: request body size (for POST/PUT requests)
// --------------------------------------------------------------------------
morgan.token("body-size", (req: Request) => {
  const len = req.headers["content-length"];
  return len ? `${len}b` : "-";
});

// --------------------------------------------------------------------------
// Morgan token: user agent shortened
// --------------------------------------------------------------------------
morgan.token("ua-short", (req: Request) => {
  const ua = req.headers["user-agent"] ?? "-";
  return ua.length > 60 ? ua.slice(0, 57) + "…" : ua;
});

// --------------------------------------------------------------------------
// Custom Morgan log format
// Format: :method :url :status :res[content-length] :response-time ms
// --------------------------------------------------------------------------
const MORGAN_FORMAT =
  process.env.NODE_ENV === "production"
    ? // JSON-friendly format for production log aggregation
      JSON.stringify({
        method: ":method",
        url: ":url",
        status: ":status",
        responseTime: ":response-time ms",
        contentLength: ":res[content-length]",
        remoteAddr: ":remote-addr",
        userAgent: ":ua-short",
        bodySize: ":body-size",
      })
    : // Human-readable for development
      ":method :url :status :res[content-length] — :response-time ms";

// --------------------------------------------------------------------------
// Exported middleware
// --------------------------------------------------------------------------
export const httpLogger = morgan(MORGAN_FORMAT, {
  stream: morganStream,

  // Skip logging for health-check endpoints to reduce noise
  skip: (_req: Request, res: Response) => {
    const isHealthCheck = _req.url === "/api/v1/health";
    const isSuccessfulHealthCheck = isHealthCheck && res.statusCode === 200;
    return isSuccessfulHealthCheck;
  },
});
