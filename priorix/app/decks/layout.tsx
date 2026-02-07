"use client";

import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { DeckProvider } from "@/contexts/DeckContext";
import SidebarLayout from "@/components/providers/SidebarLayout";

interface DeckLayoutProps {
  children: ReactNode;
}

export default function DeckLayout({ children }: DeckLayoutProps) {
  return (
    <DeckProvider>
      <SidebarLayout contentClassName="p-2 md:p-2">{children}</SidebarLayout>
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
    </DeckProvider>
  );
}
