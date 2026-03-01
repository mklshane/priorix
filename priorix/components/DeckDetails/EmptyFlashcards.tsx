import { Card, CardContent } from "@/components/ui/card";
import { Layers, Plus, Sparkles } from "lucide-react";

const EmptyFlashcards = () => {
  return (
    <Card className="border-2 border-dashed border-muted-foreground/20 dark:border-darkborder/50 bg-muted/30">
      <CardContent className="py-16 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple/10 dark:bg-purple/20 rotate-3">
          <Layers className="h-8 w-8 text-purple -rotate-3" />
        </div>
        <h3 className="text-lg font-bold mb-2">No flashcards yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4 leading-relaxed">
          Start building your deck by adding cards manually or use <strong>Magic Import</strong> to generate them from documents.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Add manually
          </span>
          <span className="text-border">|</span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Import from PDF
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyFlashcards;
