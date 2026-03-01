const LoadingState = () => {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="mb-6 md:mb-8">
        <div className="rounded-xl border-2 border-primary/20 dark:border-darkborder/50 bg-card p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
                <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                <div className="h-4 w-28 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-4 w-72 rounded bg-muted animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
                <div className="h-6 w-28 rounded-full bg-muted animate-pulse" />
              </div>
            </div>
            <div className="flex flex-row md:flex-col gap-2">
              <div className="h-10 w-28 rounded-lg bg-muted animate-pulse" />
              <div className="h-10 w-28 rounded-lg bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Add form skeleton */}
      <div className="mb-8">
        <div className="rounded-xl border-2 border-primary/20 dark:border-darkborder/50 bg-card p-5">
          <div className="h-6 w-40 rounded bg-muted animate-pulse mb-4" />
          <div className="space-y-3">
            <div className="h-10 rounded-lg bg-muted animate-pulse" />
            <div className="h-24 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
      </div>

      {/* Cards list skeleton */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-6 w-28 rounded bg-muted animate-pulse" />
          <div className="h-5 w-8 rounded bg-muted animate-pulse" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border-2 border-primary/10 dark:border-darkborder/30 bg-card p-4"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="h-7 w-7 rounded-lg bg-muted animate-pulse shrink-0" />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-3 w-10 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-full rounded bg-muted animate-pulse" />
                  <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingState;
