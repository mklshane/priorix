import { Layers, Plus, Sparkles } from "lucide-react";

const EmptyFlashcards = () => {
  return (
    <div className="border-2 border-dashed border-border rounded-3xl bg-muted/30 p-12 text-center flex flex-col items-center justify-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-lilac border-2 border-border shadow-bento-sm rotate-3 hover:rotate-0 transition-transform duration-300">
        <Layers className="h-10 w-10 text-foreground -rotate-3" />
      </div>
      <h3 className="text-3xl font-editorial mb-3">No flashcards yet</h3>
      <p className="text-base text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed font-sans">
        Start building your deck by adding cards manually or use{" "}
        <strong className="text-foreground">Magic Import</strong> to generate
        them from documents.
      </p>
      <div className="flex items-center justify-center gap-6 text-sm font-bold tracking-widest uppercase text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4 text-foreground" /> Add manually
        </span>
        <span className="text-border opacity-30">|</span>
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-foreground" /> Admin Magic
        </span>
      </div>
    </div>
  );
};

export default EmptyFlashcards;
