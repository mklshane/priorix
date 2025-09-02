import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const NotFoundState = () => {
  return (
    <div className="w-[90%] mx-auto min-h-screen py-8 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="text-muted-foreground mb-4">
            <BookOpen className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Deck Not Found</h2>
          <p className="text-muted-foreground">
            The deck you're looking for doesn't exist or you don't have access
            to it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFoundState;
