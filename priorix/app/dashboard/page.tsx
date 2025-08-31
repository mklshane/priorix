"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import RecentDecks from "@/components/dashboard/RecentDeck";
import TodoList from "@/components/dashboard/TodoList";
import QuickActions from "@/components/dashboard/QuickActions";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();

  return (
    <>
      {/* Welcome Hero Section */}
      <div className="mb-8">
        <Card className="bg-primary-foreground border-border">
          <CardContent className="py-3 px-14">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold font-sora text-foreground mb-4">
                  Hi, {user?.name}
                </h1>
                <p className="text-lg font-sora text-foreground">
                  Ready to boost your productivity today? You have 6 pending
                  tasks and 12 flashcards to review.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-50 h-50 bg-white rounded-full flex items-center justify-center">
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
          <Button variant="ghost" className="text-primary" onClick={() => {router.push('/decks')}}>
            View All <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <RecentDecks />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-4">
        <div className="lg:col-span-2 h-full">
          <TodoList />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </>
  );
}
