"use client";

import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import Sidebar from "@/components/Sidebar";
import RecentDecks from "@/components/dashboard/RecentDeck";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ArrowRight,
  BookOpen,
  CheckSquare,
  FileText,
} from "lucide-react";
import { useSession } from "next-auth/react";
import TodoList from "@/components/dashboard/TodoList";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
   const { data: session } = useSession();
    const user = session?.user;

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      // Always start closed - sidebar only opens when user clicks toggle
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    // Set initial state - always closed
    setSidebarOpen(false);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    console.log("[v0] Toggle sidebar called, current state:", sidebarOpen);
    setSidebarOpen(!sidebarOpen);
    console.log("[v0] New sidebar state will be:", !sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="relative h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      </div>

      {/* Main content */}
      <div className="w-full h-full flex flex-col overflow-hidden">
        <AppNav onToggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Welcome Hero Section */}
          <div className="mb-8">
            <Card className="bg-course-blue border-border">
              <CardContent className="py-3 px-14">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold font-sora text-foreground mb-4">
                      Hi, {user?.name}
                    </h1>
                    <p className=" text-lg font-sora text-foreground">
                      Ready to boost your productivity today? You have 6 pending
                      tasks and 12 flashcards to review.
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-50 h-50 bg-primary-foreground rounded-full flex items-center justify-center">
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
              <Button variant="ghost" className="text-primary">
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <RecentDecks />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 ">
            {/* Recent Activity - Takes 2 columns on larger screens */}
            <div className="lg:col-span-2 h-full">
              <TodoList /> {/* Replaced RecentActivity with TodoList */}
            </div>

            {/* Quick Actions */}
            <div>
              <QuickActions />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
