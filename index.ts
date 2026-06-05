/**
 * index.ts — Barrel export for campus-notifications-logging-middleware
 *
 * Usage in an Express app:
 *
 *   import { httpLogger, appLogger } from 'campus-notifications-logging-middleware';
 *
 *   app.use(httpLogger);                      // HTTP access log
 *   appLogger.info('App started', { port });  // Application log
 */

export { httpLogger } from "./httpLogger";
export { appLogger } from "./appLogger";
