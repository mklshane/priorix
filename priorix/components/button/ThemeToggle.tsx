"use client"
import React, { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";


const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark;

    if (shouldUseDark) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  return (
    <button
      className="h-10 w-10 flex items-center justify-center rounded-xl border border-sidebar-border/60 bg-sidebar-accent hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
      onClick={toggleDarkMode}
      aria-label="Toggle dark mode"
    >
      {!mounted ? (
        <Moon className="h-[18px] w-[18px]" />
      ) : isDarkMode ? (
        <Sun className="h-[18px] w-[18px]" />
      ) : (
        <Moon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
};

export default ThemeToggle;
