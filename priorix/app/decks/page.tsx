"use client";

import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";


export default function Decks() {
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
          
        </main>
      </div>
    </div>
  );
}
