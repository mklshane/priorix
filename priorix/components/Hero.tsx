"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const Hero = () => {
  const router = useRouter();
  const [isStackHovered, setIsStackHovered] = useState(false);

  return (
    <div className="w-full max-w-6xl mx-auto px-10 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-10">
        {/* Left Content */}
        <div className="flex flex-col space-y-6 md:w-1/2">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
            Focus on what
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet to-purple">
              {" "}
              truly matters
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-md">
            Priorix is the smart productivity app that helps you organize tasks,
            prioritize goals, and manage time with intuitive AI-powered
            features. Accomplish more with less stress.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              onClick={() => {
                router.push("/signup");
              }}
              className="bg-green hover:bg-green/90 text-primary font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-violet/25"
            >
              Get Started Free
            </button>
          </div>
        </div>

        {/* Right Content - Study Flashcards Stack */}
        <div className="md:w-1/2 flex justify-center w-[80%]">
          <div className="relative w-80 h-80">
            {/* Background glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple to-pink blur-lg opacity-20 dark:opacity-30 rounded-3xl"></div>

            {/* Flashcard stack container */}
            <div
              className="relative w-full h-full"
              onMouseEnter={() => setIsStackHovered(true)}
              onMouseLeave={() => setIsStackHovered(false)}
            >
              {/* Card 5 (backmost) - Blank card back */}
              <div
                className={`absolute w-full h-full bg-gradient-to-br from-violet/10 to-purple/10 rounded-xl border border-violet/15 shadow-sm transition-all duration-500 ${
                  isStackHovered
                    ? "-translate-x-8 -translate-y-6 -rotate-6"
                    : "-bottom-3 -right-3 rotate-2"
                }`}
              ></div>

              {/* Card 4 - Math */}
              <div
                className={`absolute w-full h-full bg-gradient-to-br from-violet/15 to-purple/15 rounded-xl border border-violet/20 shadow-md transition-all duration-500 ${
                  isStackHovered
                    ? "-translate-x-6 -translate-y-4 -rotate-3"
                    : "-bottom-2 -right-2 rotate-1"
                }`}
              >
                <div className="p-5 h-full flex flex-col opacity-80">
                  <div className="text-center mb-2">
                    <div className="w-8 h-8 mx-auto rounded-full bg-violet/20 flex items-center justify-center">
                      <span className="text-violet text-lg font-bold">∫</span>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xs text-violet mb-1">CALCULUS</div>
                      <div className="h-3 bg-violet/20 rounded-full w-24 mx-auto mb-2"></div>
                      <div className="h-2 bg-violet/15 rounded-full w-20 mx-auto"></div>
                    </div>
                  </div>
                  <div className="h-2 bg-violet/10 rounded-full w-full"></div>
                </div>
              </div>

              {/* Card 3 - History */}
              <div
                className={`absolute w-full h-full bg-gradient-to-br from-violet/20 to-purple/20 rounded-xl border border-violet/25 shadow-md transition-all duration-500 ${
                  isStackHovered
                    ? "-translate-x-4 -translate-y-2"
                    : "bottom-0 right-0"
                }`}
              >
                <div className="p-5 h-full flex flex-col opacity-85">
                  <div className="text-center mb-2">
                    <div className="w-8 h-8 mx-auto rounded-full bg-pink/20 flex items-center justify-center">
                      <span className="text-pink text-lg font-bold">🏛</span>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xs text-pink mb-1">HISTORY</div>
                      <div className="h-3 bg-pink/20 rounded-full w-28 mx-auto mb-2"></div>
                      <div className="h-2 bg-pink/15 rounded-full w-16 mx-auto"></div>
                    </div>
                  </div>
                  <div className="h-2 bg-pink/10 rounded-full w-full"></div>
                </div>
              </div>

              {/* Card 2 - Language */}
              <div
                className={`absolute w-full h-full bg-gradient-to-br from-pink/25 to-purple/25 rounded-xl border border-pink/30 shadow-lg transition-all duration-500 ${
                  isStackHovered
                    ? "-translate-x-2 translate-y-2 rotate-2"
                    : "top-2 left-2 -rotate-1"
                }`}
              >
                <div className="p-5 h-full flex flex-col">
                  <div className="text-center mb-2">
                    <div className="w-8 h-8 mx-auto rounded-full bg-green/20 flex items-center justify-center">
                      <span className="text-green text-lg font-bold">🔤</span>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xs text-green mb-1">LANGUAGE</div>
                      <div className="h-3 bg-green/20 rounded-full w-32 mx-auto mb-2"></div>
                      <div className="h-2 bg-green/15 rounded-full w-24 mx-auto"></div>
                    </div>
                  </div>
                  <div className="h-2 bg-green/10 rounded-full w-full"></div>
                </div>
              </div>

              {/* Card 1 (front) - Science */}
              <div
                className={`absolute w-full h-full bg-white dark:bg-gray-800 rounded-xl border border-violet/30 shadow-xl transition-all duration-500 ${
                  isStackHovered
                    ? "translate-x-2 translate-y-4 rotate-3"
                    : "top-4 left-4 -rotate-2"
                }`}
              >
                <div className="p-5 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                   
                    <div className="text-xs text-muted-foreground">
                      12 cards
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-center">
                      
                    </div>

                    <div className="space-y-2">
                      <div className="h-3 bg-violet/10 rounded-full w-full"></div>
                      <div className="h-3 bg-violet/10 rounded-full w-3/4 mx-auto"></div>
                      <div className="h-3 bg-violet/10 rounded-full w-1/2 mx-auto"></div>
                    </div>

                    <div className="bg-violet/5 p-3 rounded-lg border border-violet/10">
                      <div className="flex justify-between items-center mb-2">
                        <div className="h-2 bg-violet/20 rounded-full w-1/4"></div>
                        <div className="h-2 bg-green/20 rounded-full w-1/6"></div>
                      </div>
                      <div className="h-2 bg-violet/20 rounded-full w-full mb-2"></div>
                      <div className="h-2 bg-green/20 rounded-full w-3/4"></div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-4">
                    <div className="h-8 bg-gradient-to-r from-violet/10 to-purple/10 rounded-lg w-2/5 flex items-center justify-center">
                      <span className="text-xs text-violet">Flip</span>
                    </div>
                    <div className="h-8 bg-gradient-to-r from-green to-green/70 rounded-lg w-2/5 flex items-center justify-center">
                      <span className="text-xs text-white">Next</span>
                     
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
