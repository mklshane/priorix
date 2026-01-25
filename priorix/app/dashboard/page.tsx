"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkle, Sparkles } from "lucide-react";
import RecentDecks from "@/components/dashboard/RecentDeck";
import TodoList from "@/components/dashboard/TodoList";
import QuickActions from "@/components/dashboard/QuickActions";
import Calendar from "@/components/dashboard/Calendar";
import AddDeckModal from "@/components/Deck/AddDeckModal";
import { useState } from "react";
import { CreateDeckRequest } from "@/types/deck";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [isAddDeckModalOpen, setIsAddDeckModalOpen] = useState(false);
  const { showToast, dismissToast } = useToast();

  const handleAddDeck = async (newDeckData: CreateDeckRequest) => {
    showToast("Creating deck...", "loading");

    try {
      const res = await fetch("/api/deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDeckData,
          userId: session?.user?.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to create deck");

      const created = await res.json();

      dismissToast();
      showToast("Deck created successfully!", "success");

      setIsAddDeckModalOpen(false);
      if (created?._id) {
        router.push(`/decks/${created._id}`);
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Error creating deck:", err);
      dismissToast();
      showToast("Failed to create deck", "error");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Card className="bg-green/70 border-2 border-black dark:bg-darkcard dark:border-darkborder ">
          <CardContent className="py-3 px-5 lg:px-14">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex">
                  <h1 className="text-3xl font-bold font-sora text-foreground mb-4 mr-2">
                    Hi, {user?.name}
                  </h1>
                  <Sparkles />
                </div>
                <p className="text-md lg:text-lg font-sora text-foreground w-full lg:w-[90%]">
                  Ready to boost your productivity today? Time to set your
                  intentions, concentrate fully, and achieve more than you
                  planned today.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-50 h-50 bg-white dark:bg-pink/90 rounded-full flex items-center justify-center ">
                  <img src="/study.png" alt="" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Decks Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-sora text-foreground">
            Recent Decks
          </h2>
          <Button
            variant="ghost"
            className="text-primary"
            onClick={() => {
              router.push("/decks");
            }}
          >
            View All <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <RecentDecks />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
        <div className="lg:col-span-2 h-full">
          <TodoList />
        </div>

        <div className="flex flex-col gap-6 h-full">
          <Calendar />
          <QuickActions
            onOpenAddDeckModal={() => setIsAddDeckModalOpen(true)}
          />
        </div>
      </div>

      <AddDeckModal
        open={isAddDeckModalOpen}
        onOpenChange={setIsAddDeckModalOpen}
        onAddDeck={handleAddDeck}
      />
    </div>
  );
}
