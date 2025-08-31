"use client";

import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu, User, Settings, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import ThemeToggle from "./button/ThemeToggle";

interface AppNavProps {
  onToggleSidebar: () => void;
}

export default function AppNav({ onToggleSidebar }: AppNavProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();

  const handleToggle = () => {
    console.log("[v0] Burger menu clicked");
    onToggleSidebar();
  };

  const getFirstName = (name?: string | null) => {
    if (!name) return "User";
    return name.split(" ")[0];
  };

  const firstName = getFirstName(user?.name);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // app paths to page names
  const pageNames: Record<string, string> = {
    "/dashboard": "Priorix",
    "/decks": "Decks",
    "/todo": "Tasks",
    "/notes": "Notes",
  };

  const currentPage =
    pageNames[pathname] ||
    pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Page";

  return (
    <nav className="w-full px-6 py-4 bg-primary-foreground border-b border-gray-200  dark:border-gray-700">
      <div className="flex items-center justify-between relative">
        {/* Left - Hamburger Menu */}
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="sidebar-toggle"
            onClick={handleToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Center - Page Name (truly centered) */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="font-lora text-2xl text-gray-900 dark:text-white whitespace-nowrap">
            {currentPage}
          </h1>
        </div>

        {/* Right - Theme Toggle and User */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 bg-gray-100 border-2 rounded-full hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-600 py-1 px-3 transition-colors">
                  <span className="font-sora text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
                    {firstName}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.image ?? ""}
                      alt={user.name ?? "User"}
                    />
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="px-2 py-1.5">
                  <p className="font-sora text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="font-sora text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator className="dark:bg-gray-700" />
                <DropdownMenuItem className="cursor-pointer font-sora dark:text-gray-300 dark:focus:bg-gray-700">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer font-sora dark:text-gray-300 dark:focus:bg-gray-700">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="dark:bg-gray-700" />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="cursor-pointer text-red-600 focus:text-red-600 font-sora dark:focus:bg-gray-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}
