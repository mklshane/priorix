"use client";

import {
  Home,
  BookOpen,
  CheckSquare,
  FileText,
  Settings,
  X,
  Compass,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Decks", href: "/decks", icon: BookOpen },
  { name: "Browse", href: "/browse", icon: Compass },
  { name: "Todo", href: "/todo", icon: CheckSquare },
  { name: "Notes", href: "/notes", icon: FileText },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, isMobile, isVisible, toggleSidebar, closeSidebar } = useSidebar();

  // For mobile: use isVisible, for desktop: always visible
  const shouldShow = isMobile ? isVisible : true;
  const sidebarWidth = isMobile ? "w-64" : isOpen ? "lg:w-56" : "lg:w-20";

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        sidebarWidth,
        // Mobile: slide in/out
        isMobile && (shouldShow ? "translate-x-0" : "-translate-x-full"),
        // Desktop: always visible
        !isMobile && "translate-x-0"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <h1 className={cn(
          "text-xl text-sidebar-foreground font-lora transition-opacity duration-200 select-none",
          !isMobile && !isOpen && "lg:opacity-0 lg:w-0 lg:pointer-events-none"
        )}>
          Menu
        </h1>
        
        {/* Mobile: Close button */}
        {isMobile && (
          <button
            onClick={closeSidebar}
            className="p-2 rounded-md hover:bg-sidebar-accent transition-colors select-none cursor-pointer"
            title="Close sidebar"
          >
            <X className="h-5 w-5 text-sidebar-foreground" />
          </button>
        )}
        
        {/* Desktop: Collapse/Expand button */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:block p-2 rounded-md hover:bg-sidebar-accent transition-colors ml-auto select-none cursor-pointer"
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? (
              <ChevronLeft className="h-5 w-5 text-sidebar-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-sidebar-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 lg:px-4 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.name}
              onClick={() => {
                router.push(item.href);
                if (isMobile) closeSidebar();
              }}
              className={cn(
                "group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative select-none cursor-pointer",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                !isMobile && !isOpen && "lg:justify-center lg:px-2"
              )}
              title={!isMobile && !isOpen ? item.name : ""}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive
                    ? "text-sidebar-primary-foreground"
                    : "text-muted-foreground",
                  !isMobile && !isOpen ? "lg:mr-0" : "mr-3"
                )}
              />
              <span className={cn(
                "transition-opacity duration-200 select-none",
                !isMobile && !isOpen && "lg:opacity-0 lg:absolute lg:w-0 lg:overflow-hidden lg:pointer-events-none"
              )}>
                {item.name}
              </span>
              
              {/* Tooltip for collapsed desktop mode */}
              {!isMobile && !isOpen && (
                <span className="hidden lg:group-hover:block absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap z-50">
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-sidebar-border p-3 lg:p-4">
        <button 
          className={cn(
            "group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative select-none cursor-pointer",
            !isMobile && !isOpen && "lg:justify-center lg:px-2"
          )}
          title={!isMobile && !isOpen ? "Settings" : ""}
        >
          <Settings className={cn(
            "h-5 w-5 flex-shrink-0 text-muted-foreground",
            !isMobile && !isOpen ? "lg:mr-0" : "mr-3"
          )} />
          <span className={cn(
            "transition-opacity duration-200 select-none",
            !isMobile && !isOpen && "lg:opacity-0 lg:absolute lg:w-0 lg:overflow-hidden lg:pointer-events-none"
          )}>
            Settings
          </span>
          
          {/* Tooltip for collapsed desktop mode */}
          {!isMobile && !isOpen && (
            <span className="hidden lg:group-hover:block absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap z-50">
              Settings
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
