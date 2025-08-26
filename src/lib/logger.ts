import { supabase } from '@/integrations/supabase/client';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogContext {
  userId?: string;
  componentName?: string;
  action?: string;
  data?: any;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
}

class Logger {
  private generateErrorCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ERR-${timestamp}-${random}`.toUpperCase();
  }

  private async logToDatabase(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    errorCode?: string
  ) {
    try {
      if (level === LogLevel.ERROR || level === LogLevel.WARN) {
        await supabase.from('error_logs').insert({
          user_id: context.userId || null,
          error_code: errorCode || this.generateErrorCode(),
          error_message: message,
          component_name: context.componentName,
          stack_trace: context.stackTrace,
          user_agent: context.userAgent || navigator.userAgent,
          url: context.url || window.location.href,
          severity: level,
          context: context.data || {}
        });
      }
    } catch (error) {
      console.error('Failed to log to database:', error);
    }
  }

  debug(message: string, context: LogContext = {}) {
    console.log(`🐛 [DEBUG] ${context.componentName || 'App'}: ${message}`, context.data);
    this.logToDatabase(LogLevel.DEBUG, message, context);
  }

  info(message: string, context: LogContext = {}) {
    console.log(`ℹ️  [INFO] ${context.componentName || 'App'}: ${message}`, context.data);
    this.logToDatabase(LogLevel.INFO, message, context);
  }

  warn(message: string, context: LogContext = {}) {
    const errorCode = this.generateErrorCode();
    console.warn(`⚠️  [WARN] ${context.componentName || 'App'}: ${message} (Code: ${errorCode})`, context.data);
    this.logToDatabase(LogLevel.WARN, message, context, errorCode);
    return errorCode;
  }

  error(message: string, context: LogContext = {}) {
    const errorCode = this.generateErrorCode();
    console.error(`❌ [ERROR] ${context.componentName || 'App'}: ${message} (Code: ${errorCode})`, context.data);
    this.logToDatabase(LogLevel.ERROR, message, context, errorCode);
    return errorCode;
  }

  async logUserAction(action: string, context: LogContext = {}) {
    this.info(`User action: ${action}`, {
      ...context,
      action,
      userId: context.userId
    });
  }

  async logApiCall(endpoint: string, method: string, context: LogContext = {}) {
    this.debug(`API call: ${method} ${endpoint}`, {
      ...context,
      action: 'api_call',
      data: { endpoint, method, ...context.data }
    });
  }

  async logPerformance(operation: string, duration: number, context: LogContext = {}) {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.DEBUG;
    const message = `Performance: ${operation} took ${duration}ms`;
    
    if (level === LogLevel.WARN) {
      this.warn(message, { ...context, data: { operation, duration, ...context.data } });
    } else {
      this.debug(message, { ...context, data: { operation, duration, ...context.data } });
    }
  }
}

export const logger = new Logger();