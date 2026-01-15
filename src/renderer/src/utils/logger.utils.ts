/**
 * Logger Utility
 * Remote logging to main process (works in capture window without DevTools)
 */

/**
 * Log to main process console
 */
export function log(...args: any[]): void {
  if (typeof window !== 'undefined' && window.loggerAPI?.log) {
    window.loggerAPI.log(...args)
  } else {
    console.log(...args)
  }
}

/**
 * Log error to main process console
 */
export function error(...args: any[]): void {
  if (typeof window !== 'undefined' && window.loggerAPI?.error) {
    window.loggerAPI.error(...args)
  } else {
    console.error(...args)
  }
}

/**
 * Log warning to main process console
 */
export function warn(...args: any[]): void {
  if (typeof window !== 'undefined' && window.loggerAPI?.warn) {
    window.loggerAPI.warn(...args)
  } else {
    console.warn(...args)
  }
}

const logger = {
  log,
  warn,
  error
}

export default logger
