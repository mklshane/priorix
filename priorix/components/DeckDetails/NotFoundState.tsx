import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchX, ArrowLeft } from "lucide-react";
import Link from "next/link";

const NotFoundState = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-border dark:border-darkborder overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-purple via-pink to-perry" />
        <CardContent className="pt-8 pb-6 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <SearchX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Deck Not Found</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto leading-relaxed">
            This deck doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Link href="/decks">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Decks
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFoundState;
