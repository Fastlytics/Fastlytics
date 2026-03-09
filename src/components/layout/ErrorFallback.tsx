import { FallbackProps } from 'react-error-boundary';
import { Button } from '@/components/ui/button';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-4xl font-bold text-destructive">Oops!</h1>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <pre className="text-sm bg-muted p-4 rounded-md overflow-auto text-left max-h-48">
          {error.message}
        </pre>
        <p className="text-muted-foreground">
          We apologize for the inconvenience. Please try refreshing the page.
        </p>
        <Button onClick={resetErrorBoundary} variant="default">
          Try Again
        </Button>
      </div>
    </div>
  );
}
