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

export default function SidebarLayout({ children, contentClassName }: SidebarLayoutProps) {
  const { isOpen, isMobile, isVisible, closeSidebar } = useSidebar();

  return (
    <div className="relative min-h-screen">
      {/* Backdrop overlay - mobile only */}
      {isMobile && isVisible && (
        <div
          className="fixed inset-0 bg-black/10 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - always rendered */}
      <Sidebar />

      {/* Main content wrapper - adjusts based on sidebar state */}
      <div
        className={cn(
          "min-h-screen flex flex-col transition-all duration-300",
          // Desktop: shift content based on sidebar width
          !isMobile && (isOpen ? "lg:ml-56" : "lg:ml-20"),
          // Mobile: no shift (sidebar is overlay)
          isMobile && "ml-0"
        )}
      >
        <AppNav />
        <main className={cn("flex-1 overflow-y-auto", contentClassName || "p-4 md:p-6 lg:p-8")}>
          {children}
        </main>
      </div>
    </div>
  );
}
