import { useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';

export interface TimeoutConfig {
  timeout?: number; // in milliseconds, default 15000 (15 seconds)
  onTimeout?: (errorCode: string) => void;
  componentName?: string;
  operation?: string;
}

export function useTimeout<T>(
  asyncOperation: () => Promise<T>,
  config: TimeoutConfig = {}
) {
  const {
    timeout = 15000,
    onTimeout,
    componentName = 'Unknown',
    operation = 'async operation'
  } = config;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const execute = async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    setData(null);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const startTime = Date.now();

    logger.debug(`Starting ${operation}`, {
      componentName,
      action: 'timeout_operation_start'
    });

    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      const code = logger.error(`Timeout: ${operation} exceeded ${timeout}ms`, {
        componentName,
        action: 'timeout',
        data: { timeout, operation }
      });
      
      setErrorCode(code);
      setError(`Operation timed out. Please try again. (Error: ${code})`);
      setLoading(false);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      onTimeout?.(code);
    }, timeout);

    try {
      const result = await asyncOperation();
      
      // Clear timeout on success
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const duration = Date.now() - startTime;
      logger.logPerformance(operation, duration, { componentName });

      setData(result);
      setLoading(false);
      
      logger.debug(`Completed ${operation} successfully`, {
        componentName,
        action: 'timeout_operation_success',
        data: { duration }
      });

      return result;
    } catch (err: any) {
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const duration = Date.now() - startTime;
      
      if (err.name === 'AbortError') {
        // This was a timeout, error already set
        return;
      }

      const code = logger.error(`Error in ${operation}: ${err.message}`, {
        componentName,
        action: 'timeout_operation_error',
        data: { error: err.message, duration },
        stackTrace: err.stack
      });

      setErrorCode(code);
      setError(`Operation failed: ${err.message} (Error: ${code})`);
      setLoading(false);
    }
  };

  const retry = () => {
    logger.info(`Retrying ${operation}`, {
      componentName,
      action: 'retry'
    });
    execute();
  };

  const reset = () => {
    setData(null);
    setError(null);
    setErrorCode(null);
    setLoading(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    errorCode,
    execute,
    retry,
    reset
  };
}