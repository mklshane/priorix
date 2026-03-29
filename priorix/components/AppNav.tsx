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
import { Menu, User, Settings, LogOut, ArrowLeft } from "lucide-react";
import { usePathname, useRouter, useParams } from "next/navigation";
import ThemeToggle from "./button/ThemeToggle";
import { useSidebar } from "@/contexts/SidebarContext";

export default function AppNav() {
  const { data: session } = useSession();
  const { toggleSidebar } = useSidebar();
  const user = session?.user;
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const [deckName, setDeckName] = useState<string>("");
  const [noteName, setNoteName] = useState<string>("");
  const [fromDashboardRecent, setFromDashboardRecent] = useState(false);

  useEffect(() => {
    const fromDashboard =
      sessionStorage.getItem("fromDashboardRecent") === "true";
    setFromDashboardRecent(fromDashboard);
  }, []);

  const isOnDeckPage = pathname.match(/^\/decks\/([^\/]+)$/) !== null;
  const isOnStudyPage = pathname.match(/^\/decks\/([^\/]+)\/study$/) !== null;
  const isOnSrsPage = pathname.match(/^\/decks\/([^\/]+)\/study-srs$/) !== null;
  const isOnNotePage = pathname.match(/^\/notes\/([^\/]+)$/) !== null;

  const getDeckId = () => {
    if (params.deckId) return params.deckId as string;
    const studyMatch = pathname.match(/^\/decks\/([^\/]+)\/study$/);
    if (studyMatch && studyMatch[1]) return studyMatch[1];
    const srsMatch = pathname.match(/^\/decks\/([^\/]+)\/study-srs$/);
    if (srsMatch && srsMatch[1]) return srsMatch[1];
    const deckMatch = pathname.match(/^\/decks\/([^\/]+)$/);
    if (deckMatch && deckMatch[1]) return deckMatch[1];
    return null;
  };

  const handleBack = () => {
    if (isOnStudyPage || isOnSrsPage) {
      const deckId = getDeckId();
      sessionStorage.removeItem("fromDashboardRecent");
      sessionStorage.removeItem("lastDashboardPath");
      router.push(deckId && deckId !== "new" ? `/decks/${deckId}` : "/decks");
      return;
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
    router.push("/dashboard");
  };

  const getFirstName = (name?: string | null) =>
    name ? name.split(" ")[0] : "User";
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length === 1
      ? parts[0][0]?.toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  };

  useEffect(() => {
    const deckId = getDeckId();
    if (deckId && deckId !== "new") {
      fetch(`/api/deck?id=${deckId}`)
        .then((res) => res.ok && res.json())
        .then((deck) => setDeckName(deck?.title || "Deck"))
        .catch(() => setDeckName("Deck"));
    } else setDeckName("");
  }, [pathname, params]);

  useEffect(() => {
    const noteMatch = pathname.match(/^\/notes\/([^\/]+)$/);
    if (noteMatch && noteMatch[1]) {
      fetch(`/api/notes/${noteMatch[1]}`)
        .then((res) => res.ok && res.json())
        .then((note) => setNoteName(note?.title || "Note"))
        .catch(() => setNoteName("Note"));
    } else setNoteName("");
  }, [pathname]);

  const shouldShowBackButton =
    isOnStudyPage || isOnSrsPage || isOnDeckPage || isOnNotePage;
  const shouldShowHamburgerMenu =
    pathname === "/dashboard" ||
    (!isOnDeckPage && !isOnStudyPage && !isOnSrsPage && !isOnNotePage);

  const pageNames: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/decks": "Flashcards",
    "/browse": "Browse",
    "/todo": "Tasks",
    "/notes": "Notes",
    "/analytics": "Analytics",
    "/settings/learning": "Settings",
    "/settings/profile": "Settings",
  };

  const getCurrentPage = () => {
    if (isOnStudyPage || isOnSrsPage) return deckName || "Study Session";
    if (isOnNotePage) return noteName || "Note";
    const deckId = getDeckId();
    if (deckId) return deckId === "new" ? "New Deck" : deckName || "Loading...";
    if (pageNames[pathname]) return pageNames[pathname];
    return (
      pathname
        .split("/")
        .filter(Boolean)
        .pop()
        ?.replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()) || "Page"
    );
  };

  return (
    <nav className="sticky top-0 z-40 w-full h-16 bg-card border-b-2 border-border px-4 lg:px-6 flex items-center justify-between font-sans shadow-sm">
      {/* Left Actions */}
      <div className="flex-shrink-0 w-12">
        {shouldShowBackButton ? (
          <button
            className="flex items-center justify-center w-10 h-10 border-2 border-transparent hover:border-border rounded-xl hover:bg-muted transition-all"
            onClick={() =>
              isOnNotePage ? router.push("/notes") : handleBack()
            }
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : shouldShowHamburgerMenu ? (
          <button
            className="lg:hidden flex items-center justify-center w-10 h-10 border-2 border-transparent hover:border-border rounded-xl hover:bg-muted transition-all"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2 overflow-hidden px-4">
        <h1 className="font-sans text-xl font-semibold tracking-wide text-foreground truncate max-w-[200px] sm:max-w-md">
          {getCurrentPage()}
        </h1>
      </div>

      {/* Right - Profile & Theme */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 border-2 border-border hover:border-primary bg-background rounded-full md:pl-3 pl-1 pr-1 py-1 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <span className="font-bold text-xs uppercase tracking-widest hidden sm:block pt-0.5">
                  {getFirstName(user.name)}
                </span>
                <Avatar className="h-7 w-7 border-2 border-border">
                  <AvatarImage
                    src={user.image ?? ""}
                    alt={user.name ?? "User"}
                  />
                  <AvatarFallback className="bg-citrus text-foreground font-bold text-[10px]">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 bg-card border-2 border-border rounded-2xl p-2 font-sans mt-4"
            >
              <div className="px-3 py-2 bg-muted/50 rounded-xl mb-2 border-2 border-transparent">
                <p className="font-bold text-sm text-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs font-medium text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              <DropdownMenuItem
                onClick={() => router.push("/settings/profile")}
                className="cursor-pointer font-bold text-xs uppercase tracking-widest rounded-lg py-2 focus:bg-muted focus:text-foreground"
              >
                <User className="mr-3 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/settings/learning")}
                className="cursor-pointer font-bold text-xs uppercase tracking-widest rounded-lg py-2 focus:bg-muted focus:text-foreground"
              >
                <Settings className="mr-3 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/20 my-2" />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="cursor-pointer font-bold text-xs uppercase tracking-widest text-destructive focus:bg-destructive focus:text-destructive-foreground rounded-lg py-2"
              >
                <LogOut className="mr-3 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}
