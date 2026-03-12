"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--card)",
          color: "var(--card-foreground)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.12)",
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: "#16a34a",
            secondary: "var(--card)",
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: "#dc2626",
            secondary: "var(--card)",
          },
        },
      }}
    />
  );
}
