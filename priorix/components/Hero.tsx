import Link from "next/link";
import { ArrowRight, Sparkles, BookOpen } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 overflow-hidden pt-30">
      <div className="absolute top-1/2 left-1/2 -translate-x-[clamp(24rem,40vw,37rem)] -translate-y-[clamp(10rem,16vh,13rem)] hidden lg:flex flex-col gap-4 animate-fade-in">
        <div className="bg-mint border-2 border-border rounded-3xl p-4 shadow-bento rotate-[-6deg] w-48 hover:rotate-0 transition-transform duration-300">
          <Sparkles className="w-6 h-6 mb-2" />
          <p className="font-bold text-sm">Spaced Repetition</p>
        </div>
      </div>

      <div
        className="absolute top-1/2 left-1/2 translate-x-[clamp(14rem,26vw,24rem)] translate-y-[clamp(8rem,13vh,11rem)] hidden lg:flex flex-col gap-4 animate-fade-in"
        style={{ animationDelay: "200ms" }}
      >
        <div className="bg-citrus border-2 border-border rounded-3xl p-4 shadow-bento rotate-[8deg] w-56 hover:rotate-0 transition-transform duration-300">
          <BookOpen className="w-6 h-6 mb-2" />
          <p className="font-bold text-sm">AI-Powered Flashcards</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto text-center z-10 space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-border bg-lilac shadow-bento text-sm font-bold uppercase tracking-wider mb-4 hover:-translate-y-1 hover:shadow-bento-lg transition-all cursor-default">
          <span className="w-2 h-2 rounded-full bg-border animate-pulse" />
          Priorix is here
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-tight">
          The smarter way to <br />
          <span className="italic text-muted-foreground/80">
            learn, plan, and remember.
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl font-medium text-muted-foreground mt-6">
          Create smarter flashcards, organize notes, and track progress with a
          study planner built for college students.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link
            href="/signup"
            className="w-full sm:w-auto btn-primary text-lg px-8 py-4 group"
          >
            Start Learning
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto btn-base bg-card text-card-foreground hover:-translate-y-1 hover:shadow-bento px-8 py-4"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </section>
  );
}
