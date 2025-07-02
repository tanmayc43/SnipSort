import React from 'react';
import { Button } from './button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to monitoring service
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Something went wrong</h2>
              <p className="text-muted-foreground">
                {this.props.fallbackMessage || 
                 "We're sorry, but something unexpected happened. Please try refreshing the page."}
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, resetError, message }) => {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <div className="space-y-2">
          <h3 className="font-semibold">Error</h3>
          <p className="text-sm text-muted-foreground">
            {message || error?.message || 'Something went wrong'}
          </p>
        </div>
        {resetError && (
          <Button onClick={resetError} size="sm" variant="outline">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

export { ErrorBoundary, ErrorFallback };