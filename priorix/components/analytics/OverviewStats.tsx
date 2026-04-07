"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Clock, Target, Flame, Activity } from "lucide-react";

interface OverviewStatsProps {
  stats: any;
  layout?: string;
  syncHeightSelector?: string;
}

export default function OverviewStats({
  stats,
  layout = "grid",
  syncHeightSelector,
}: OverviewStatsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [syncedMinHeight, setSyncedMinHeight] = useState<number | null>(null);
  const colors = ["bg-citrus", "bg-mint", "bg-lilac", "bg-blush"];
  const items = [
    {
      icon: <BookOpen className="h-4 w-4" />,
      label: "Studied Today",
      value: stats.totalCardsStudied,
      subtext: "Cards reviewed today",
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Focus Time",
      value: `${Math.round(stats.totalStudyTime)}m`,
      subtext: "Total active study minutes",
    },
    {
      icon: <Target className="h-4 w-4" />,
      label: "SRS Accuracy",
      value: `${stats.srsAverageAccuracy ?? stats.averageAccuracy}%`,
      subtext: "Spaced recall retention",
    },
    {
      icon: <Flame className="h-4 w-4" />,
      label: "Current Streak",
      value: `${stats.currentStreak}d`,
      subtext: "Consecutive study days",
    },
  ];

  useEffect(() => {
    if (layout !== "vertical" || !syncHeightSelector) {
      setSyncedMinHeight(null);
      return;
    }

    const mediaQuery = window.matchMedia(
      "(min-width: 1024px) and (min-height: 1366px)",
    );
    const target = document.querySelector<HTMLElement>(syncHeightSelector);

    if (!target) {
      setSyncedMinHeight(null);
      return;
    }

    const updateHeight = () => {
      if (!mediaQuery.matches) {
        setSyncedMinHeight(null);
        return;
      }
      setSyncedMinHeight(target.getBoundingClientRect().height);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(target);

    mediaQuery.addEventListener("change", updateHeight);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", updateHeight);
      window.removeEventListener("resize", updateHeight);
    };
  }, [layout, syncHeightSelector]);

  return (
    <div
      ref={rootRef}
      className={`h-full flex flex-col ${layout === "vertical" ? "bento-card bg-card p-6 font-sans" : ""}`}
      style={syncedMinHeight ? { minHeight: `${syncedMinHeight}px` } : undefined}
    >
      {layout === "vertical" && (
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-citrus border-2 border-border flex items-center justify-center shadow-bento-sm">
            <Activity className="h-5 w-5" />
          </div>
          <h3 className="text-2xl font-editorial italic">Overview Stats</h3>
        </div>
      )}
      
      <div
        className={
          layout === "compact"
            ? "grid grid-cols-1 sm:grid-cols-2 gap-4 h-full"
            : layout === "vertical"
              ? "grid grid-cols-2 auto-rows-fr gap-3 flex-1 h-full"
              : "grid grid-cols-1 md:grid-cols-4 gap-4"
        }
      >
        {items.map((item, i) => (
        <div
          key={i}
          className={`bento-card ${colors[i % colors.length]} p-4 py-7.5 flex-1 flex flex-col justify-between hover:-translate-y-1 transition-transform group relative overflow-hidden`}
        >
          {/* Subtle background decor */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-background/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          
          <div className="flex justify-between items-start mb-2 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest leading-tight opacity-90 pr-2">
              {item.label}
            </span>
            <div className="w-7 h-7 rounded-xl bg-background/60 backdrop-blur-sm border-2 border-border flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform shrink-0">
              {item.icon}
            </div>
          </div>
          <div className="relative z-10 mt-2">
            <p className="text-3xl font-editorial leading-none">
              {item.value}
            </p>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
