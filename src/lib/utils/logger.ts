/**
 * Secure logging utility that prevents sensitive data leakage
 * and provides structured logging for production environments
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const sensitiveKeys = [
      'password', 'token', 'key', 'secret', 'auth', 'credential',
      'api_key', 'apikey', 'authorization', 'bearer'
    ]

    const sanitized = { ...data }
    
    for (const key in sanitized) {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key])
      }
    }

    return sanitized
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? this.sanitizeData(context) : undefined,
      error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined
    }

    if (this.isDevelopment) {
      // In development, use console for immediate feedback
      const logMethod = level === 'error' ? console.error : 
                       level === 'warn' ? console.warn : 
                       console.log
      
      logMethod(`[${level.toUpperCase()}] ${message}`, context ? this.sanitizeData(context) : '')
      if (error) {
        console.error(error)
      }
    } else if (this.isProduction) {
      // In production, use structured logging (could be sent to external service)
      console.log(JSON.stringify(entry))
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, context, error)
  }

  // Security-focused logging methods
  securityEvent(event: string, context?: Record<string, any>) {
    this.log('warn', `SECURITY: ${event}`, context)
  }

  authEvent(event: string, context?: Record<string, any>) {
    this.log('info', `AUTH: ${event}`, this.sanitizeData(context || {}))
  }
}

export const logger = new Logger()
export default logger