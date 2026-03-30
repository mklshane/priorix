"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { 
  Settings, 
  Target, 
  Clock, 
  TrendingUp, 
  Zap,
  RefreshCw,
  Bell
} from "lucide-react";

interface LearningProfile {
  learningSpeed: "slow" | "medium" | "fast";
  dailyReviewGoal: number;
  sessionLengthPreference: number;
  optimalSessionLength?: number;
  difficultyPreference: "challenge" | "balanced" | "confidence";
  preferredStudyTimes: number[];
  smartNotifications: boolean;
  isCalibrated: boolean;
  personalMultipliers?: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
}

async function fetchLearningProfile(userId: string): Promise<LearningProfile> {
  const res = await fetch(`/api/user/learning-profile?userId=${userId}`);
  if (!res.ok) {
    // Return defaults if not found
    return {
      learningSpeed: "medium",
      dailyReviewGoal: 50,
      sessionLengthPreference: 20,
      difficultyPreference: "balanced",
      preferredStudyTimes: [9, 10, 11, 14, 15, 16, 19, 20],
      smartNotifications: false,
      isCalibrated: false,
    };
  }
  return res.json();
}

async function updateLearningProfile(userId: string, profile: Partial<LearningProfile>) {
  const res = await fetch(`/api/user/learning-profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...profile }),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

async function recalibrateProfile(userId: string) {
  const res = await fetch(`/api/user/calibrate-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Failed to recalibrate profile");
  return res.json();
}

export default function LearningSettingsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["learning-profile", session?.user?.id],
    queryFn: () => fetchLearningProfile(session!.user!.id),
    enabled: !!session?.user?.id,
  });

  const [dailyGoal, setDailyGoal] = useState(50);
  const [sessionLength, setSessionLength] = useState(20);
  const [difficulty, setDifficulty] = useState<"challenge" | "balanced" | "confidence">("balanced");
  const [smartNotifications, setSmartNotifications] = useState(false);
  const [preferredStudyTimes, setPreferredStudyTimes] = useState<number[]>([]);

  useEffect(() => {
    if (profile) {
      setDailyGoal(profile.dailyReviewGoal ?? 50);
      setSessionLength(profile.sessionLengthPreference ?? profile.optimalSessionLength ?? 20);
      setDifficulty(profile.difficultyPreference ?? "balanced");
      setSmartNotifications(profile.smartNotifications ?? false);
      setPreferredStudyTimes(profile.preferredStudyTimes ?? []);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<LearningProfile>) =>
      updateLearningProfile(session!.user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-profile", session?.user?.id] });
      showToast("Settings updated successfully!", "success");
    },
    onError: () => {
      showToast("Failed to update settings", "error");
    },
  });

  const recalibrateMutation = useMutation({
    mutationFn: () => recalibrateProfile(session!.user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-profile", session?.user?.id] });
      showToast("Profile recalibrated successfully!", "success");
    },
    onError: () => {
      showToast("Failed to recalibrate profile", "error");
    },
  });

  const toggleStudyHour = (hour: number) => {
    setPreferredStudyTimes((prev) =>
      prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour]
    );
  };

  const handleSave = () => {
    updateMutation.mutate({
      dailyReviewGoal: dailyGoal,
      sessionLengthPreference: sessionLength,
      difficultyPreference: difficulty,
      smartNotifications,
      preferredStudyTimes,
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-muted rounded w-64 mb-2"></div>
        <div className="h-4 bg-muted rounded w-96 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="h-48 bg-muted rounded-3xl"></div>
           <div className="h-48 bg-muted rounded-3xl"></div>
           <div className="h-48 bg-muted rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-editorial tracking-tight mb-3 flex items-center gap-3">
          <Settings className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          Learning Settings
        </h1>
        <p className="text-lg text-muted-foreground font-sans">
          Customize your adaptive learning experience and study preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Learning Speed Status (Full Width if present) */}
        {profile?.isCalibrated && (
          <Card className="md:col-span-2 border-2 border-border shadow-bento-sm rounded-3xl bg-mint overflow-hidden transition-all hover:shadow-bento">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-background border-2 border-border flex flex-shrink-0 items-center justify-center shadow-sm">
                    <TrendingUp className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold font-sans mb-1 text-foreground">
                      Profile Calibrated
                    </h3>
                    <p className="text-sm font-medium text-foreground/80">
                      Learning speed: <span className="font-bold capitalize bg-background px-2 py-0.5 rounded-full border-2 border-border ml-1">{profile.learningSpeed}</span>
                    </p>
                    {profile.personalMultipliers && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(["again", "hard", "good", "easy"] as const).map((rating) => (
                          <span
                            key={rating}
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-background/70 border-2 border-border px-2 py-1 rounded-full"
                          >
                            <span className="capitalize">{rating}</span>
                            <span className="text-foreground/60">→</span>
                            <span>{profile.personalMultipliers![rating].toFixed(1)}×</span>
                          </span>
                        ))}
                        <span className="text-[10px] text-foreground/60 self-center font-medium">
                          interval multipliers
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => recalibrateMutation.mutate()}
                  disabled={recalibrateMutation.isPending}
                  className="w-full md:w-auto h-12 px-6 rounded-full border-2 border-border font-bold bg-background hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${recalibrateMutation.isPending ? 'animate-spin' : ''}`} />
                  {recalibrateMutation.isPending ? 'Recalibrating...' : 'Recalibrate Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Review Goal */}
        <Card className="border-2 border-border shadow-bento-sm rounded-3xl bg-card transition-all hover:shadow-bento">
          <CardContent className="p-6 md:p-8 flex flex-col h-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-citrus border-2 border-border flex flex-shrink-0 items-center justify-center shadow-sm">
                <Target className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-sans mb-1 text-foreground">Daily Goal</h3>
                <p className="text-sm text-muted-foreground font-medium">
                  How many cards to review daily?
                </p>
              </div>
            </div>
            
            <div className="mt-auto space-y-6">
              <div className="flex items-baseline justify-between">
                <span className="text-4xl font-editorial tracking-tight text-foreground">
                  {dailyGoal}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cards</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Session Length */}
        <Card className="border-2 border-border shadow-bento-sm rounded-3xl bg-card transition-all hover:shadow-bento">
          <CardContent className="p-6 md:p-8 flex flex-col h-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-lilac border-2 border-border flex flex-shrink-0 items-center justify-center shadow-sm">
                <Clock className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-sans mb-1 text-foreground">Session Length</h3>
                <p className="text-sm text-muted-foreground font-medium">
                  Ideal cards per study session
                </p>
              </div>
            </div>
            
            <div className="mt-auto pt-4">
              <Select
                value={sessionLength.toString()}
                onValueChange={(value) => setSessionLength(Number(value))}
              >
                <SelectTrigger className="w-full h-12 rounded-2xl border-2 border-border bg-background font-medium focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 border-border shadow-bento-sm">
                  <SelectItem value="10" className="font-medium cursor-pointer rounded-xl">10 cards (Quick)</SelectItem>
                  <SelectItem value="20" className="font-medium cursor-pointer rounded-xl">20 cards (Standard)</SelectItem>
                  <SelectItem value="30" className="font-medium cursor-pointer rounded-xl">30 cards (Extended)</SelectItem>
                  <SelectItem value="40" className="font-medium cursor-pointer rounded-xl">40 cards (Intensive)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Difficulty Preference */}
        <Card className="border-2 border-border shadow-bento-sm rounded-3xl bg-card transition-all hover:shadow-bento">
          <CardContent className="p-6 md:p-8 flex flex-col h-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-blush border-2 border-border flex flex-shrink-0 items-center justify-center shadow-sm">
                <Zap className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-sans mb-1 text-foreground">Difficulty Bias</h3>
                <p className="text-sm text-muted-foreground font-medium">
                  Card prioritization strategy
                </p>
              </div>
            </div>
            
            <div className="mt-auto pt-4 space-y-3">
              <Select
                value={difficulty}
                onValueChange={(value: any) => setDifficulty(value)}
              >
                <SelectTrigger className="w-full h-12 rounded-2xl border-2 border-border bg-background font-medium focus:ring-0 focus:ring-offset-0 h-auto py-3">
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 border-border shadow-bento-sm">
                  <SelectItem value="challenge" className="cursor-pointer rounded-xl py-3 px-4 my-1">
                    <div className="flex items-center justify-between w-full min-w-[200px] gap-4">
                      <span className="font-bold text-foreground">Challenge</span>
                      <span className="text-xs font-medium text-muted-foreground truncate">Prioritize hard cards</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="balanced" className="cursor-pointer rounded-xl py-3 px-4 my-1">
                    <div className="flex items-center justify-between w-full min-w-[200px] gap-4">
                      <span className="font-bold text-foreground">Balanced</span>
                      <span className="text-xs font-medium text-muted-foreground truncate">Mix of all levels</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="confidence" className="cursor-pointer rounded-xl py-3 px-4 my-1">
                    <div className="flex items-center justify-between w-full min-w-[200px] gap-4">
                      <span className="font-bold text-foreground">Confidence</span>
                      <span className="text-xs font-medium text-muted-foreground truncate">Include easy cards</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {difficulty === "challenge" && (
                <p className="text-xs text-muted-foreground font-medium bg-muted/50 rounded-xl px-3 py-2">
                  Hard and failed cards are shown first. Good for aggressive review sessions.
                </p>
              )}
              {difficulty === "balanced" && (
                <p className="text-xs text-muted-foreground font-medium bg-muted/50 rounded-xl px-3 py-2">
                  Cards shown in order of urgency — the default. Works well for all learners.
                </p>
              )}
              {difficulty === "confidence" && (
                <p className="text-xs text-muted-foreground font-medium bg-muted/50 rounded-xl px-3 py-2">
                  30% of each session includes mastered cards to reinforce memory and build momentum.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Smart Notifications */}
        <Card className="border-2 border-border shadow-bento-sm rounded-3xl bg-sky/50 transition-all hover:shadow-bento opacity-80">
          <CardContent className="p-6 md:p-8 flex flex-col h-full justify-between">
             <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-background border-2 border-border flex flex-shrink-0 items-center justify-center shadow-sm">
                <Bell className="h-5 w-5 text-foreground" />
              </div>
              <div className="pr-4">
                <h3 className="text-lg font-bold font-sans mb-1 text-foreground">Smart Notifications</h3>
                <p className="text-sm text-foreground/70 font-medium">
                  Get reminders during your optimal study times.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-border/20">
              <span className="text-xs font-bold uppercase tracking-widest text-foreground/60 bg-background/50 px-3 py-1 rounded-full border-2 border-border/20">Coming Soon</span>
              <Switch
                checked={smartNotifications}
                onCheckedChange={setSmartNotifications}
                disabled={true}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferred Study Times */}
        <Card className="md:col-span-2 border-2 border-border shadow-bento-sm rounded-3xl bg-card transition-all hover:shadow-bento">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-sky border-2 border-border flex flex-shrink-0 items-center justify-center shadow-sm">
                <Clock className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-sans mb-1 text-foreground">Preferred Study Hours</h3>
                <p className="text-sm text-muted-foreground font-medium">
                  Click hours to toggle your preferred study times (0–23)
                </p>
              </div>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5">
              {Array.from({ length: 24 }, (_, h) => {
                const isSelected = preferredStudyTimes.includes(h);
                const label = h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;
                return (
                  <button
                    key={h}
                    onClick={() => toggleStudyHour(h)}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 py-2 px-1 text-[9px] font-bold uppercase tracking-wider transition-all ${
                      isSelected
                        ? "bg-citrus border-border text-foreground -translate-y-0.5"
                        : "bg-card border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {preferredStudyTimes.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                {preferredStudyTimes.length} hour{preferredStudyTimes.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Action */}
      <div className="mt-8 flex justify-end">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full md:w-auto h-14 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-border font-bold text-base hover:-translate-y-1 hover:shadow-bento transition-all active:translate-y-0 active:shadow-none"
        >
          {updateMutation.isPending ? "Saving changes..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}