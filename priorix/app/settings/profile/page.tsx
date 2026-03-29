"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { User, Mail, Lock, Info } from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  createdAt: string;
  isOAuthUser: boolean;
}

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch("/api/user/profile");
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession();
  const { showToast } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: fetchProfile,
    enabled: !!session?.user?.id,
  });

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name);
    }
  }, [profile]);

  const nameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update name");
      }
      return res.json();
    },
    onSuccess: async (data) => {
      await update({ name: data.name });
      showToast("Name updated successfully!", "success");
    },
    onError: (err: Error) => {
      showToast(err.message, "error");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update password");
      }
      return res.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated successfully!", "success");
    },
    onError: (err: Error) => {
      showToast(err.message, "error");
    },
  });

  const handlePasswordSave = () => {
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    passwordMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-64"></div>
        <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-sora flex items-center gap-3 mb-2">
          <User className="h-8 w-8" />
          Profile Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account information
        </p>
      </div>

      <div className="space-y-6">
        {/* Display Name */}
        <Card className="border-2 border-black dark:border-darkborder rounded-xl bg-sky/30 dark:bg-sky/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5" />
              <div>
                <h3 className="font-semibold font-sora">Display Name</h3>
                <p className="text-sm text-muted-foreground">
                  This name appears across your account
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-2 border-black/10 dark:border-darkborder"
                maxLength={100}
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => nameMutation.mutate(name)}
                  disabled={nameMutation.isPending || name === profile?.name}
                  className="border-2 border-black dark:border-darkborder font-sora"
                >
                  {nameMutation.isPending ? "Saving..." : "Save Name"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email */}
        <Card className="border-2 border-black dark:border-darkborder rounded-xl bg-citrus/30 dark:bg-citrus/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-5 w-5" />
              <div>
                <h3 className="font-semibold font-sora">Email Address</h3>
                <p className="text-sm text-muted-foreground">
                  {profile?.isOAuthUser
                    ? "Managed by your Google account"
                    : "Your login email address"}
                </p>
              </div>
            </div>
            <Input
              value={profile?.email ?? ""}
              readOnly
              className="border-2 border-black/10 dark:border-darkborder bg-muted/50 cursor-not-allowed"
            />
          </CardContent>
        </Card>

        {/* Change Password — hidden for OAuth users */}
        {!profile?.isOAuthUser && (
          <Card className="border-2 border-black dark:border-darkborder rounded-xl bg-blush/30 dark:bg-blush/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold font-sora">Change Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Update your account password
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="border-2 border-black/10 dark:border-darkborder mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-2 border-black/10 dark:border-darkborder mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-2 border-black/10 dark:border-darkborder mt-1"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handlePasswordSave}
                    disabled={
                      passwordMutation.isPending ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                    className="border-2 border-black dark:border-darkborder font-sora"
                  >
                    {passwordMutation.isPending ? "Saving..." : "Update Password"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Info */}
        <Card className="border-2 border-black dark:border-darkborder rounded-xl bg-mint/30 dark:bg-mint/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Info className="h-5 w-5" />
              <div>
                <h3 className="font-semibold font-sora">Account Info</h3>
                <p className="text-sm text-muted-foreground">
                  Details about your account
                </p>
              </div>
            </div>
            <div className="text-sm space-y-1">
              <p>
                <span className="font-semibold">Member since:</span>{" "}
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : "—"}
              </p>
              <p>
                <span className="font-semibold">Account type:</span>{" "}
                {profile?.isOAuthUser ? "Google" : "Email & Password"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
