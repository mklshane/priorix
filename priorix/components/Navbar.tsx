"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 font-sans">
      <div className="bg-background border-2 border-border rounded-full px-6 py-2 flex items-center justify-between shadow-bento transition-all">
        <Link
          href="/"
          className="font-editorial italic text-3xl font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          Priorix
        </Link>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
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
