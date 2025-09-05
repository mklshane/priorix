"use client";

import { ReactNode, useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";
import { DeckProvider } from "@/contexts/DeckContext";

interface DeckLayoutProps {
  children: ReactNode;
}

export default function DeckLayout({ children }: DeckLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <DeckProvider>
      {" "}

      <div className="relative h-screen bg-background">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/10 z-40"
            onClick={closeSidebar}
            role="presentation"
          />
        )}

        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        </div>

        <div className="w-full h-full flex flex-col overflow-hidden">
          <AppNav onToggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#4ade80",
                secondary: "#fff",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </div>
    </DeckProvider>
  );
}
