"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { User, Mail, Lock, Info, CalendarDays, ShieldCheck } from "lucide-react";

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
        <div className="h-10 bg-muted rounded w-64 mb-2"></div>
        <div className="h-4 bg-muted rounded w-96 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="h-64 bg-muted rounded-3xl md:col-span-2"></div>
           <div className="h-48 bg-muted rounded-3xl md:col-span-2"></div>
           <div className="h-48 bg-muted rounded-3xl md:col-span-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-editorial tracking-tight mb-3 flex items-center gap-3">
          <User className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          Profile Settings
        </h1>
        <p className="text-lg text-muted-foreground font-sans">
          Manage your account information and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info (Full Width) */}
        <Card className="md:col-span-2 border-2 border-border shadow-bento-sm rounded-3xl bg-card transition-all hover:shadow-bento">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Display Name Section */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-mint border-2 border-border flex items-center justify-center shadow-sm">
                    <User className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-sans text-foreground">Display Name</h3>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Name</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 h-12 rounded-2xl border-2 border-border bg-background px-4 font-medium focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                      maxLength={100}
                    />
                    <Button
                      onClick={() => nameMutation.mutate(name)}
                      disabled={nameMutation.isPending || name === profile?.name}
                      className="h-12 px-6 rounded-2xl border-2 border-border font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:-translate-y-0.5 transition-transform active:translate-y-0"
                    >
                      {nameMutation.isPending ? "Saving..." : "Update Name"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Vertical Divider on Desktop */}
              <div className="hidden md:block w-0.5 bg-border rounded-full"></div>
              {/* Horizontal Divider on Mobile */}
              <div className="md:hidden h-0.5 w-full bg-border rounded-full"></div>

              {/* Email Section */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-citrus border-2 border-border flex items-center justify-center shadow-sm">
                    <Mail className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-sans text-foreground">Email Address</h3>
                  </div>
                </div>
                
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                    {profile?.isOAuthUser && (
                       <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Google Auth</span>
                    )}
                   </div>
                  <Input
                    value={profile?.email ?? ""}
                    readOnly
                    className="h-12 rounded-2xl border-2 border-border bg-muted/30 px-4 font-medium text-muted-foreground cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <p className="text-xs text-muted-foreground font-medium ml-1">
                    {profile?.isOAuthUser
                      ? "Your email is managed securely via Google."
                      : "Primary email address for login and notifications."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password (Only visible if not OAuth) */}
        {!profile?.isOAuthUser && (
          <Card className="md:col-span-2 border-2 border-border shadow-bento-sm rounded-3xl bg-card transition-all hover:shadow-bento">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-blush border-2 border-border flex flex-shrink-0 items-center justify-center shadow-sm">
                  <Lock className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-sans mb-1 text-foreground">Security Settings</h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    Update your account password
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-12 rounded-2xl border-2 border-border bg-background px-4 font-medium focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                  />
                </div>
                
                <div className="row-span-2 hidden md:flex flex-col justify-end pb-1">
                   <div className="p-4 rounded-2xl bg-muted/30 border-2 border-border/50 text-sm font-medium text-muted-foreground">
                     Choose a strong, unique password. We recommend using a mix of letters, numbers, and symbols to keep your account secure.
                   </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 rounded-2xl border-2 border-border bg-background px-4 font-medium focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 rounded-2xl border-2 border-border bg-background px-4 font-medium focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handlePasswordSave}
                  disabled={
                    passwordMutation.isPending ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className="w-full md:w-auto h-12 px-8 rounded-full border-2 border-border font-bold bg-foreground text-background hover:bg-foreground/90 shadow-sm hover:-translate-y-0.5 transition-transform active:translate-y-0"
                >
                  {passwordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expanded Account Info Stats */}
        <Card className="md:col-span-2 border-2 border-border shadow-bento-sm rounded-3xl bg-lilac/50 transition-all hover:shadow-bento">
          <CardContent className="p-6 md:p-8 flex flex-col h-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-background border-2 border-border flex flex-shrink-0 items-center justify-center shadow-sm">
                <Info className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-sans mb-1 text-foreground">Account Details</h3>
                <p className="text-sm text-foreground/70 font-medium">
                  Quick facts about your profile
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
              <div className="flex flex-col p-5 rounded-2xl bg-background border-2 border-border/50 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Member Since</span>
                </div>
                <span className="text-xl md:text-2xl font-bold font-sans">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                    : "—"}
                </span>
              </div>
              
              <div className="flex flex-col p-5 rounded-2xl bg-background border-2 border-border/50 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Auth Provider</span>
                </div>
                <span className="text-xl md:text-2xl font-bold font-sans capitalize">
                  {profile?.isOAuthUser ? "Google Auth" : "Email / Password"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}