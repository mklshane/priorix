import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const EmptyFlashcards = () => {
  return (
    <Card className="border-2 border-dashed border-muted-foreground/25">
      <CardContent className="py-12 text-center">
        <div className="text-muted-foreground mb-6">
          <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
          <p className="text-sm max-w-md mx-auto">
            Add your first flashcard using the form above to get started with
            studying!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyFlashcards;
