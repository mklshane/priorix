import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  return (
    <div className="w-[90%] mx-auto min-h-screen py-8 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="text-red-500 mb-4">
            <BookOpen className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Deck</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={onRetry}>Try Again</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorState;
