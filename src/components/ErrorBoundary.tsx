import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  errorCode?: string;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorCode = logger.error('Component crashed', {
      componentName: this.props.componentName || 'ErrorBoundary',
      stackTrace: error.stack,
      data: {
        error: error.message,
        errorInfo: errorInfo.componentStack
      }
    });

    this.setState({ errorCode });
  }

  private handleRetry = () => {
    logger.info('User initiated error boundary retry', {
      componentName: this.props.componentName || 'ErrorBoundary',
      action: 'retry'
    });
    
    this.setState({ hasError: false, error: undefined, errorCode: undefined });
  };

  private handleCopyErrorCode = () => {
    if (this.state.errorCode) {
      navigator.clipboard.writeText(this.state.errorCode);
      toast.success('Error code copied to clipboard');
      
      logger.info('User copied error code', {
        componentName: this.props.componentName || 'ErrorBoundary',
        action: 'copy_error_code',
        data: { errorCode: this.state.errorCode }
      });
    }
  };

  private handleReportIssue = () => {
    const { errorCode, error } = this.state;
    const subject = `Error Report: ${errorCode}`;
    const body = `Error Code: ${errorCode}\nComponent: ${this.props.componentName || 'Unknown'}\nError: ${error?.message}\nURL: ${window.location.href}\n\nPlease describe what you were doing when this error occurred:`;
    
    const mailtoLink = `mailto:support@yourapp.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);

    logger.info('User initiated error report', {
      componentName: this.props.componentName || 'ErrorBoundary',
      action: 'report_issue',
      data: { errorCode }
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred in the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.errorCode && (
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-sm font-medium mb-1">Error Code:</div>
                  <div className="font-mono text-xs break-all">{this.state.errorCode}</div>
                </div>
              )}
              
              <div className="flex flex-col space-y-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                
                {this.state.errorCode && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={this.handleCopyErrorCode}
                      className="w-full"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Error Code
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={this.handleReportIssue}
                      className="w-full"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Report Issue
                    </Button>
                  </>
                )}
              </div>

              <div className="text-xs text-muted-foreground text-center">
                If this problem persists, please contact support with the error code above.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}