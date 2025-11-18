export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

class Logger {
  private minLevel: LogLevel = 'info';

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    if (envLevel && this.isValidLogLevel(envLevel)) {
      this.minLevel = envLevel as LogLevel;
    }
  }

  private isValidLogLevel(level: string): boolean {
    return ['debug', 'info', 'warn', 'error'].includes(level);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        ...(error && {
          error: {
            message: error.message,
            stack: error.stack,
            ...error,
          },
        }),
      };
      console.error(this.formatMessage('error', message, errorContext));
    }
  }
}

export const logger = new Logger();
