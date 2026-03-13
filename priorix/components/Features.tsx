import {
  Brain,
  Layers,
  CheckSquare,
  Sparkles,
  LineChart,
  Clock,
} from "lucide-react";

export default function Features() {
  return (
    <section
      id="features"
      className="py-0 md:py-24 px-4 max-w-7xl mx-auto selection:bg-citrus selection:text-foreground"
    >
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-border bg-tangerine shadow-bento text-xs font-bold uppercase tracking-widest mx-auto rotate-[-2deg]">
          <Sparkles className="w-4 h-4" />
          Features
        </div>
        <h2 className="text-5xl md:text-7xl font-editorial tracking-tight">
          Everything you need. <br className="hidden md:block" />
          <span className="italic text-muted-foreground">
            Nothing you don't.
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 md:gap-8 auto-rows-[minmax(280px,auto)]">
        <div className="bento-card md:col-span-2 bg-card hover:shadow-bento-hover transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-mint rounded-full opacity-50 blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl border-2 border-border bg-mint flex items-center justify-center shadow-bento mb-6">
              <Brain className="w-7 h-7" />
            </div>
            <h3 className="text-3xl font-editorial mb-3">
              Adaptive Spaced Repetition
            </h3>
            <p className="text-muted-foreground font-medium max-w-md leading-relaxed">
              Our algorithm tracks your memory decay. It surfaces the flashcards
              you're about to forget, exactly when you need to see them.
            </p>
          </div>
        </div>

        {/* Feature 2: Standard Box (AI Generation) */}
        <div className="bento-card bg-lilac hover:shadow-bento-hover transition-all flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 rounded-full border-2 border-border bg-background flex items-center justify-center shadow-bento mb-6">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-3xl font-editorial mb-3">AI Generation</h3>
            <p className="text-foreground/80 font-medium leading-relaxed">
              Upload your PDFs or paste your lecture notes. Priorix instantly
              extracts key concepts into study decks.
            </p>
          </div>
        </div>

        {/* Feature 3: Standard Box (Task Ledger) */}
        <div className="bento-card bg-sky hover:shadow-bento-hover transition-all flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 rounded-full border-2 border-border bg-background flex items-center justify-center shadow-bento mb-6">
              <CheckSquare className="w-7 h-7" />
            </div>
            <h3 className="text-3xl font-editorial mb-3">To Do</h3>
            <p className="text-foreground/80 font-medium leading-relaxed">
              A heavily structured daily agenda to track
              assignments, exams, and study sessions.
            </p>
          </div>
        </div>

        {/* Feature 4: Large Span (Analytics) */}
        <div className="bento-card md:col-span-2 bg-card hover:shadow-bento-hover transition-all flex flex-col md:flex-row gap-8 items-center relative overflow-hidden group">
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-citrus rounded-full opacity-50 blur-3xl group-hover:scale-150 transition-transform duration-700" />

          <div className="flex-1 relative z-10">
            <div className="w-14 h-14 rounded-2xl border-2 border-border bg-citrus flex items-center justify-center shadow-bento mb-6">
              <LineChart className="w-7 h-7" />
            </div>
            <h3 className="text-3xl font-editorial mb-3">Deep Analytics</h3>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Visualize your mastery. Heatmaps show your daily consistency,
              while accuracy charts pinpoint exactly which topics need more
              attention before the exam.
            </p>
          </div>

          <div className="w-full md:w-1/3 h-32 md:h-full border-2 border-border rounded-2xl bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMxMTExMTEiIG9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] flex items-center justify-center overflow-hidden">
            <div className="bg-background border-2 border-border px-4 py-2 rounded-full shadow-bento font-bold text-sm -rotate-6">
              +42% Retention
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
