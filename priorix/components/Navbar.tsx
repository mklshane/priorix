"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If we scroll down and are past the top threshold, hide the navbar
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false);
        setIsOpen(false); // Close mobile menu if it was open when scrolling down
      } else {
        // If we scroll up, show the navbar
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <nav 
      className={`fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 font-sans transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-[150%]"
      }`}
    >
      <div className="bg-background border-2 border-border rounded-full px-6 py-2 flex items-center justify-between transition-all">
        <Link
          href="/"
          className="font-editorial italic text-3xl font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          Priorix
        </Link>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/browse"
            className="text-sm font-bold uppercase tracking-widest hover:text-muted-foreground transition-colors px-2"
          >
            Browse Decks
          </Link>
          {session ? (
            <Link
              href="/dashboard"
              className="btn-pastel-mint px-6 py-2 text-sm"
            >
              Enter Ledger
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-bold uppercase tracking-widest hover:text-muted-foreground transition-colors px-2"
              >
                Log In
              </Link>
              <Link href="/signup" className="btn-primary px-6 py-2 text-sm">
                Start Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 border-2 border-transparent hover:border-border rounded-full transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="absolute top-[120%] left-0 w-full bg-background border-2 border-border rounded-3xl p-6 shadow-bento flex flex-col gap-6 md:hidden animate-in slide-in-from-top-4">
          <Link
            href="/browse"
            className="btn-base bg-card w-full text-center"
            onClick={() => setIsOpen(false)}
          >
            Browse Decks
          </Link>
          {session ? (
            <Link
              href="/dashboard"
              className="btn-pastel-mint w-full text-center"
              onClick={() => setIsOpen(false)}
            >
              Enter Ledger
            </Link>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className="btn-base bg-card w-full text-center"
                onClick={() => setIsOpen(false)}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="btn-primary w-full text-center"
                onClick={() => setIsOpen(false)}
              >
                Start Free
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
