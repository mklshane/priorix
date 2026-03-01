import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-destructive/30 dark:border-red-500/30 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-destructive via-red-400 to-destructive" />
        <CardContent className="pt-8 pb-6 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 dark:bg-red-500/15">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto leading-relaxed">
            {error}
          </p>
          <Button
            onClick={onRetry}
            className="gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.08)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorState;
