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
import { usePathname, useRouter, useParams } from "next/navigation";
import ThemeToggle from "./button/ThemeToggle";
import { useSidebar } from "@/contexts/SidebarContext";

export default function AppNav() {
  const { data: session } = useSession();
  const { toggleSidebar, isMobile } = useSidebar();
  const user = session?.user;
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const [deckName, setDeckName] = useState<string>("");
  const [fromDashboardRecent, setFromDashboardRecent] = useState(false);

  useEffect(() => {
    const fromDashboard =
      sessionStorage.getItem("fromDashboardRecent") === "true";
    setFromDashboardRecent(fromDashboard);
  }, []);

  const isOnDeckPage = pathname.match(/^\/decks\/([^\/]+)$/) !== null;
  const isOnStudyPage = pathname.match(/^\/decks\/([^\/]+)\/study$/) !== null;
  const isOnSrsPage = pathname.match(/^\/decks\/([^\/]+)\/study-srs$/) !== null;

  const handleBack = () => {
    if (isOnStudyPage || isOnSrsPage) {
      const deckId = getDeckId();
      console.log("Study page - deckId:", deckId);

      if (deckId && deckId !== "new") {
        const targetUrl = `/decks/${deckId}`;
        sessionStorage.removeItem("fromDashboardRecent");
        sessionStorage.removeItem("lastDashboardPath");
        router.push(`/decks/${deckId}`);
        return;
      } else {
        console.log("No valid deckId found, going to /decks");

        sessionStorage.removeItem("fromDashboardRecent");
        sessionStorage.removeItem("lastDashboardPath");
        router.push("/decks");
        return;
      }
    }
    const lastDashboardPath = sessionStorage.getItem("lastDashboardPath");

    if (
      fromDashboardRecent &&
      lastDashboardPath &&
      lastDashboardPath !== pathname
    ) {
      sessionStorage.removeItem("fromDashboardRecent");
      sessionStorage.removeItem("lastDashboardPath");
      router.push(lastDashboardPath);
      return;
    }
    if (isOnDeckPage) {
      if (
        fromDashboardRecent &&
        lastDashboardPath &&
        lastDashboardPath !== pathname
      ) {
        sessionStorage.removeItem("fromDashboardRecent");
        sessionStorage.removeItem("lastDashboardPath");
        router.push(lastDashboardPath);
      } else {
        router.push("/decks");
      }
      return;
    }
    console.log("Navigating to /dashboard (fallback)");
    router.push("/dashboard");
  };

  const handleToggle = () => {
    console.log("[v0] Burger menu clicked");
    toggleSidebar();
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
    if (params.deckId) {
      return params.deckId as string;
    }
    const studyMatch = pathname.match(/^\/decks\/([^\/]+)\/study$/);
    if (studyMatch && studyMatch[1]) {
      return studyMatch[1];
    }

    const srsMatch = pathname.match(/^\/decks\/([^\/]+)\/study-srs$/);
    if (srsMatch && srsMatch[1]) {
      return srsMatch[1];
    }

    const deckMatch = pathname.match(/^\/decks\/([^\/]+)$/);
    if (deckMatch && deckMatch[1]) {
      return deckMatch[1];
    }

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
  }, [pathname, params]);

  // Show back button in these cases:
  // 1. Always show on study pages (to go back to deck details)
  // 2. Always show on deck pages (to go back to appropriate location)
  const shouldShowBackButton = isOnStudyPage || isOnSrsPage || isOnDeckPage;

  // Show hamburger menu when:
  // 1. On dashboard page
  // 2. On other pages that aren't deck/study pages (like /decks, /todo, /notes)
  const shouldShowHamburgerMenu =
    pathname === "/dashboard" || (!isOnDeckPage && !isOnStudyPage && !isOnSrsPage);

  const pageNames: Record<string, string> = {
    "/dashboard": "Priorix",
    "/decks": "Decks",
    "/browse": "Browse",
    "/todo": "Tasks",
    "/notes": "Notes",
  };

  const getCurrentPage = () => {
    if (isOnStudyPage || isOnSrsPage) {
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
    <nav className="w-full h-16 bg-sidebar border-b border-sidebar-border px-4 lg:px-6 flex items-center justify-between">
      <div className="flex items-center justify-between w-full relative">
        {/* Left - Hamburger Menu or Back Button */}
        <div className="flex-shrink-0">
          {shouldShowBackButton ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 hover:bg-sidebar-accent text-sidebar-foreground rounded-lg transition-colors"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : shouldShowHamburgerMenu ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 lg:hidden hover:bg-sidebar-accent text-sidebar-foreground rounded-lg transition-colors"
              onClick={handleToggle}
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : null}
        </div>

        {/* Center - Page Name */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="font-lora text-lg lg:text-xl text-sidebar-foreground whitespace-nowrap">
            {currentPage}
          </h1>
        </div>

        {/* Right - Theme Toggle and User */}
        <div className="flex items-center space-x-2 lg:space-x-3">
          <ThemeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 h-9 bg-sidebar-accent hover:bg-sidebar-accent/80 border border-sidebar-border rounded-lg px-2 lg:px-3 transition-colors">
                  <span className="font-sora text-sm text-sidebar-foreground hidden sm:block">
                    {firstName}
                  </span>
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src={user.image ?? ""}
                      alt={user.name ?? "User"}
                    />
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 dark:border-gray-700"
              >
                <div className="px-2 py-1.5">
                  <p className="font-sora text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="font-sora text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator className="dark:bg-gray-700" />
                <DropdownMenuItem
                  disabled
                  className="cursor-not-allowed font-sora text-muted-foreground opacity-60 dark:text-gray-500 dark:focus:bg-gray-700"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled
                  className="cursor-not-allowed font-sora text-muted-foreground opacity-60 dark:text-gray-500 dark:focus:bg-gray-700"
                >
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
