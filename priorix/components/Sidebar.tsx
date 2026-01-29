"use client";

import {
  Home,
  BookOpen,
  CheckSquare,
  FileText,
  Settings,
  X,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Decks", href: "/decks", icon: BookOpen },
  { name: "Browse", href: "/browse", icon: Compass },
  { name: "Todo", href: "/todo", icon: CheckSquare },
  { name: "Notes", href: "/notes", icon: FileText },
];

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6">
        <h1 className="text-xl text-sidebar-foreground font-lora">Menu</h1>
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-sidebar-accent transition-colors"
          title="Close sidebar"
        >
          <X className="h-5 w-5 text-sidebar-foreground" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.name}
              onClick={() => {
                router.push(item.href);
                onClose?.();
              }}
              className={cn(
                "group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive
                    ? "text-sidebar-primary-foreground"
                    : "text-muted-foreground"
                )}
              />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-sidebar-border p-4">
        <button className="group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-muted-foreground" />
          Settings
        </button>
      </div>
    </div>
  );
}
