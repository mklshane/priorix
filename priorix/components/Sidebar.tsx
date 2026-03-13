"use client";

import {
  Home,
  BookOpen,
  CheckSquare,
  FileText,
  Settings,
  X,
  Compass,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";

const navigation = [
  {
    name: "Home",
    href: "/dashboard",
    icon: Home,
    hoverClass: "hover:bg-mint/30",
  },
  {
    name: "Decks",
    href: "/decks",
    icon: BookOpen,
    hoverClass: "hover:bg-lilac/30",
  },
  {
    name: "Browse",
    href: "/browse",
    icon: Compass,
    hoverClass: "hover:bg-blush/30",
  },
  {
    name: "Todo",
    href: "/todo",
    icon: CheckSquare,
    hoverClass: "hover:bg-citrus/30",
  },
  {
    name: "Notes",
    href: "/notes",
    icon: FileText,
    hoverClass: "hover:bg-sky/30",
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, isMobile, isVisible, toggleSidebar, closeSidebar } =
    useSidebar();

  const shouldShow = isMobile ? isVisible : true;
  const sidebarWidth = isMobile ? "w-64" : isOpen ? "lg:w-64" : "lg:w-20";

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-card border-r-2 border-border transition-all duration-300 ease-in-out font-sans",
        sidebarWidth,
        isMobile && (shouldShow ? "translate-x-0" : "-translate-x-full"),
        !isMobile && "translate-x-0",
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b-2 border-border">
        <h1
          className={cn(
            "text-2xl font-editorial italic tracking-tight transition-opacity duration-200 select-none",
            !isMobile &&
              !isOpen &&
              "lg:opacity-0 lg:w-0 lg:pointer-events-none",
          )}
        >
          Priorix
        </h1>

        {isMobile && (
          <button
            onClick={closeSidebar}
            className="p-1.5 border-2 border-transparent hover:border-border rounded-full hover:bg-muted transition-all select-none"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full border-2 border-transparent hover:border-border hover:bg-muted transition-all ml-auto select-none"
          >
            {isOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <button
              key={item.name}
              onClick={() => {
                router.push(item.href);
                if (isMobile) closeSidebar();
              }}
              className={cn(
                "group flex w-full items-center rounded-full px-2 py-2.5 transition-all duration-200 select-none border-2",
                isActive
                  ? "bg-tangerine text-primary border-primary"
                  : `bg-transparent text-foreground border-transparent hover:border-border/20 ${item.hoverClass}`,
                !isMobile && !isOpen && "lg:justify-center lg:px-0",
              )}
              title={!isMobile && !isOpen ? item.name : ""}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground",
                  !isMobile && !isOpen ? "lg:mr-0" : "mr-3",
                )}
              />
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-widest transition-opacity duration-200",
                  !isMobile &&
                    !isOpen &&
                    "lg:opacity-0 lg:absolute lg:w-0 lg:overflow-hidden lg:pointer-events-none",
                )}
              >
                {item.name}
              </span>

              {!isMobile && !isOpen && (
                <span className="hidden lg:group-hover:block absolute left-[110%] ml-2 px-2.5 py-1.5 bg-foreground text-background font-bold text-[10px] uppercase tracking-widest rounded-lg whitespace-nowrap z-50 shadow-bento">
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t-2 border-border p-3">
        <button
          onClick={() => {
            router.push("/settings/learning");
            if (isMobile) closeSidebar();
          }}
          className={cn(
            "group flex w-full items-center rounded-xl px-3 py-2.5 transition-all duration-200 select-none border-2",
            pathname === "/settings/learning" ||
              pathname.startsWith("/settings/")
              ? "bg-citrus text-primary-foreground border-primary"
              : "bg-transparent text-foreground border-transparent hover:border-border/20 hover:bg-muted/50",
            !isMobile && !isOpen && "lg:justify-center lg:px-0",
          )}
        >
          <Settings
            className={cn(
              "h-5 w-5 flex-shrink-0 transition-transform group-hover:rotate-90",
              pathname === "/settings/learning" ||
                pathname.startsWith("/settings/")
                ? "text-primary-foreground"
                : "text-muted-foreground",
              !isMobile && !isOpen ? "lg:mr-0" : "mr-3",
            )}
          />
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-widest transition-opacity duration-200",
              !isMobile &&
                !isOpen &&
                "lg:opacity-0 lg:absolute lg:w-0 lg:overflow-hidden lg:pointer-events-none",
            )}
          >
            Settings
          </span>
        </button>
      </div>
    </div>
  );
}
