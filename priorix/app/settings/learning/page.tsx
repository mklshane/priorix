"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  RefreshCw
} from "lucide-react";

interface LearningProfile {
  learningSpeed: "slow" | "medium" | "fast";
  dailyReviewGoal: number;
  sessionLengthPreference: number;
  difficultyPreference: "challenge" | "balanced" | "confidence";
  preferredStudyTimes: number[];
  smartNotifications: boolean;
  isCalibrated: boolean;
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

  useEffect(() => {
    if (profile) {
      setDailyGoal(profile.dailyReviewGoal);
      setSessionLength(profile.sessionLengthPreference);
      setDifficulty(profile.difficultyPreference);
      setSmartNotifications(profile.smartNotifications);
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

  const handleSave = () => {
    updateMutation.mutate({
      dailyReviewGoal: dailyGoal,
      sessionLengthPreference: sessionLength,
      difficultyPreference: difficulty,
      smartNotifications,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-64"></div>
          <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-sora flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8" />
          Learning Settings
        </h1>
        <p className="text-muted-foreground">
          Customize your adaptive learning experience
        </p>
      </div>

      <div className="space-y-6">
        {/* Learning Speed Status */}
        {profile?.isCalibrated && (
          <Card className="border-2 border-black dark:border-darkborder rounded-xl bg-green/30 dark:bg-green/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold font-sora flex items-center gap-2 mb-1">
                    <TrendingUp className="h-5 w-5" />
                    Profile Calibrated
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your learning speed: <span className="font-semibold capitalize">{profile.learningSpeed}</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => recalibrateMutation.mutate()}
                  disabled={recalibrateMutation.isPending}
                  className="border-2 border-black dark:border-darkborder"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${recalibrateMutation.isPending ? 'animate-spin' : ''}`} />
                  Recalibrate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Review Goal */}
        <Card className="border-2 border-black dark:border-darkborder rounded-xl bg-yellow/30 dark:bg-yellow/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-5 w-5" />
              <div>
                <h3 className="font-semibold font-sora">Daily Review Goal</h3>
                <p className="text-sm text-muted-foreground">
                  How many cards do you want to review each day?
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-sora">
                  {dailyGoal} cards
                </span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="w-64"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Length */}
        <Card className="border-2 border-black dark:border-darkborder rounded-xl bg-purple/30 dark:bg-purple/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5" />
              <div>
                <h3 className="font-semibold font-sora">Preferred Session Length</h3>
                <p className="text-sm text-muted-foreground">
                  Ideal number of cards per study session
                </p>
              </div>
            </div>
            <Select
              value={sessionLength.toString()}
              onValueChange={(value) => setSessionLength(Number(value))}
            >
              <SelectTrigger className="w-full border-2 border-black/10 dark:border-darkborder">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 cards (Quick session)</SelectItem>
                <SelectItem value="20">20 cards (Standard)</SelectItem>
                <SelectItem value="30">30 cards (Extended)</SelectItem>
                <SelectItem value="40">40 cards (Intensive)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Difficulty Preference */}
        <Card className="border-2 border-black dark:border-darkborder rounded-xl bg-pink/30 dark:bg-pink/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-5 w-5" />
              <div>
                <h3 className="font-semibold font-sora">Difficulty Preference</h3>
                <p className="text-sm text-muted-foreground">
                  Choose your card prioritization strategy
                </p>
              </div>
            </div>
            <Select
              value={difficulty}
              onValueChange={(value: any) => setDifficulty(value)}
            >
              <SelectTrigger className="w-full border-2 border-black/10 dark:border-darkborder">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="challenge">
                  <div className="flex flex-col">
                    <span className="font-semibold">Challenge Mode</span>
                    <span className="text-xs text-muted-foreground">
                      Prioritize harder cards
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="balanced">
                  <div className="flex flex-col">
                    <span className="font-semibold">Balanced</span>
                    <span className="text-xs text-muted-foreground">
                      Mix of all difficulty levels
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="confidence">
                  <div className="flex flex-col">
                    <span className="font-semibold">Confidence Building</span>
                    <span className="text-xs text-muted-foreground">
                      Include more mastered cards
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Smart Notifications (Future Feature) */}
        <Card className="border-2 border-black dark:border-darkborder rounded-xl bg-perry/30 dark:bg-perry/10 opacity-60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-semibold font-sora">Smart Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Get reminders during your optimal study times (Coming soon)
                  </p>
                </div>
              </div>
              <Switch
                checked={smartNotifications}
                onCheckedChange={setSmartNotifications}
                disabled={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-green dark:bg-green/90 text-black hover:bg-green/80 dark:hover:bg-green/70 border-2 border-black dark:border-darkborder font-sora"
          >
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
