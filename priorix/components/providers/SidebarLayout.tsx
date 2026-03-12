"use client";

import { ReactNode } from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import Sidebar from "@/components/Sidebar";
import AppNav from "@/components/AppNav";
import { cn } from "@/lib/utils";

interface SidebarLayoutProps {
  children: ReactNode;
  contentClassName?: string;
}

export default function SidebarLayout({
  children,
  contentClassName,
}: SidebarLayoutProps) {
  const { isOpen, isMobile, isVisible, closeSidebar } = useSidebar();

  return (
    <div className="relative min-h-screen bg-background font-sans selection:bg-mint selection:text-foreground">
      {/* Mobile Backdrop Overlay */}
      {isMobile && isVisible && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Edge-to-Edge Sidebar */}
      <Sidebar />

      {/* Main Content Wrapper - Shifts based on Sidebar Width */}
      <div
        className={cn(
          "min-h-screen flex flex-col transition-all duration-300 ease-in-out",
          !isMobile && (isOpen ? "lg:ml-64" : "lg:ml-20"),
          isMobile && "ml-0",
        )}
      >
        {/* Edge-to-Edge Top Navigation */}
        <AppNav />

        {/* Main Workspace Area */}
        <main
          className={cn(
            "flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8",
            contentClassName,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
