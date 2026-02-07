"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
  isOpen: boolean;
  isMobile: boolean;
  isVisible: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = "priorix-sidebar-state";
const MOBILE_BREAKPOINT = 1024;

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true); // Default: expanded on desktop
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // Mobile overlay visibility

  // Initialize from localStorage and detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      
      // On desktop, read from localStorage
      if (!mobile) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setIsOpen(stored === "true");
        }
      } else {
        // On mobile, always start with overlay hidden
        setIsVisible(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Persist desktop sidebar state
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem(STORAGE_KEY, String(isOpen));
    }
  }, [isOpen, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsVisible((prev) => !prev);
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsVisible(false);
    }
  };

  const setSidebarOpen = (open: boolean) => {
    if (isMobile) {
      setIsVisible(open);
    } else {
      setIsOpen(open);
    }
  };

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isMobile,
        isVisible,
        toggleSidebar,
        closeSidebar,
        setSidebarOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
