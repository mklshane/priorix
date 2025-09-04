"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu, User, Settings, LogOut, ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./button/ThemeToggle";

interface AppNavProps {
  onToggleSidebar: () => void;
}

export default function AppNav({ onToggleSidebar }: AppNavProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  const router = useRouter();
  const [deckName, setDeckName] = useState<string>("");
  const [fromDashboardRecent, setFromDashboardRecent] = useState(false);

  // Initialize from sessionStorage on client side only
  useEffect(() => {
    const fromDashboard =
      sessionStorage.getItem("fromDashboardRecent") === "true";
    setFromDashboardRecent(fromDashboard);
  }, []);

  const handleBack = () => {
    // Check if we came from dashboard recent decks
    const lastDashboardPath = sessionStorage.getItem("lastDashboardPath");

    if (
      fromDashboardRecent &&
      lastDashboardPath &&
      lastDashboardPath !== pathname
    ) {
      // Navigate back to the stored dashboard path
      sessionStorage.removeItem("fromDashboardRecent");
      sessionStorage.removeItem("lastDashboardPath");
      router.push(lastDashboardPath);
    } else if (isOnStudyPage) {
      // Default behavior: go back to deck page from study
      router.push(`/decks/${getDeckId()}`);
    } else if (isOnDeckPage) {
      // Default behavior: go back to decks list
      router.push("/decks");
    } else {
      // Fallback: go to dashboard
      router.push("/dashboard");
    }
  };

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

  const getDeckId = () => {
    const deckMatch = pathname.match(/^\/decks\/([^\/]+)$/);
    if (deckMatch) return deckMatch[1];

    const studyMatch = pathname.match(/^\/decks\/([^\/]+)\/study$/);
    if (studyMatch) return studyMatch[1];

    return null;
  };

  useEffect(() => {
    const deckId = getDeckId();
    if (deckId && deckId !== "new") {
      const fetchDeckName = async () => {
        try {
          const res = await fetch(`/api/deck?id=${deckId}`);
          if (res.ok) {
            const deck = await res.json();
            setDeckName(deck.title || "Deck");
          }
        } catch (error) {
          console.error("Error fetching deck name:", error);
          setDeckName("Deck");
        }
      };
      fetchDeckName();
    } else {
      setDeckName("");
    }
  }, [pathname]);

  const isOnDeckPage = pathname.match(/^\/decks\/([^\/]+)$/) !== null;
  const isOnStudyPage = pathname.match(/^\/decks\/([^\/]+)\/study$/) !== null;

  // Show back button only in specific cases:
  // 1. When on deck/study pages AND we came from dashboard recent decks
  // 2. When on study page (to go back to deck)
  // 3. When on deck page but NOT from dashboard (to go back to decks list)
  const shouldShowBackButton =
    (isOnDeckPage && fromDashboardRecent) ||
    (isOnStudyPage && fromDashboardRecent) ||
    isOnStudyPage ||
    (isOnDeckPage && !fromDashboardRecent);

  // Show hamburger menu when:
  // 1. On dashboard page
  // 2. On other pages that aren't deck/study pages (like /decks, /todo, /notes)
  // 3. On deck pages but NOT from dashboard recent decks
  const shouldShowHamburgerMenu =
    pathname === "/dashboard" ||
    (!isOnDeckPage && !isOnStudyPage) ||
    (isOnDeckPage && !fromDashboardRecent);

  const pageNames: Record<string, string> = {
    "/dashboard": "Priorix",
    "/decks": "Decks",
    "/todo": "Tasks",
    "/notes": "Notes",
  };

  const getCurrentPage = () => {
    if (isOnStudyPage) {
      return deckName || "Study";
    }

    const deckId = getDeckId();
    if (deckId) {
      if (deckId === "new") {
        return "New Deck";
      }
      return deckName || "Loading...";
    }

    if (pageNames[pathname]) {
      return pageNames[pathname];
    }

    return (
      pathname
        .split("/")
        .filter(Boolean)
        .pop()
        ?.replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()) || "Page"
    );
  };

  const currentPage = getCurrentPage();

  return (
    <nav className="w-full px-6 py-4 bg-primary-foreground border-b border-gray-200  dark:border-gray-700">
      <div className="flex items-center justify-between relative">
        {/* Left - Hamburger Menu or Back Button */}
        <div className="flex-shrink-0">
          {shouldShowBackButton ? (
            <Button
              variant="ghost"
              size="sm"
              className="back-button"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : shouldShowHamburgerMenu ? (
            <Button
              variant="ghost"
              size="sm"
              className="sidebar-toggle"
              onClick={handleToggle}
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : null}
        </div>

        {/* Center - Page Name */}
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
