"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const Hero = () => {
  const router = useRouter();
  const [isStackHovered, setIsStackHovered] = useState(false);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16 flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 lg:gap-12 w-full">
        {/* Left Content */}
        <div className="flex flex-col space-y-4 md:space-y-6 lg:w-1/2 text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
            Focus on what
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet to-purple">
              {" "}
              truly matters
            </span>
          </h1>

          <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
            Priorix is the smart productivity app that helps you organize tasks,
            prioritize goals, and manage time with intuitive AI-powered
            features. Accomplish more with less stress.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-4 md:mt-6 justify-center lg:justify-start">
            <button
              onClick={() => {
                router.push("/signup");
              }}
              className="bg-green hover:bg-green/90 text-primary font-medium py-2 md:py-3 px-6 md:px-8 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-violet/25 text-sm md:text-base"
            >
              Get Started Free
            </button>
          </div>
        </div>

       
        <div className="lg:w-1/2 flex justify-center w-full max-w-xl lg:max-w-2xl mt-8 lg:mt-0">
          <div className="relative w-full max-w-2xl aspect-video">
            <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-purple to-pink blur-2xl opacity-25 dark:opacity-30 rounded-3xl"></div>

            <div
              className="relative h-full w-full"
              onMouseEnter={() => setIsStackHovered(true)}
              onMouseLeave={() => setIsStackHovered(false)}
            >
              <div
                className={`absolute inset-0 rounded-2xl border border-violet/20 bg-gradient-to-br from-violet/15 to-purple/15 shadow-xl transition-all duration-500 ${
                  isStackHovered ? "-rotate-2 translate-x-2" : "rotate-1"
                }`}
              ></div>

              <div
                className={`absolute inset-3 rounded-2xl bg-white dark:bg-gray-900 border border-violet/25 shadow-2xl overflow-hidden transition-all duration-500 ${
                  isStackHovered ? "translate-y-1" : "-translate-y-1"
                }`}
              >
                <div className="flex items-center justify-between px-4 py-2 bg-violet/10 border-b border-violet/15">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink/70"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green"></span>
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">Science</div>
                  <div className="h-2 w-6 bg-violet/20 rounded-full" />
                </div>

                <div className="h-full flex flex-col  p-5 bg-gradient-to-b from-white to-violet/5 dark:from-gray-900 dark:to-gray-950">
                  <div>
                    <div className="text-xs font-semibold text-violet">TERM</div>
                    <div className="mt-3 space-y-2">
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                        Photosynthesis
                      </div>
                      <div className="text-sm text-muted-foreground">
                        How plants convert light into chemical energy.
                      </div>
                    </div>
                  </div>

                  <div className="mt-15 flex items-center justify-end gap-3">
                    <button className="h-10 w-10 rounded-lg bg-white/70 dark:bg-gray-800 border border-violet/15 flex items-center justify-center text-violet text-base font-semibold shadow-sm transition hover:shadow-md">
                      ←
                    </button>
                    <button className="h-10 w-10 rounded-lg bg-violet text-white flex items-center justify-center text-base font-semibold shadow-md transition hover:-translate-y-0.5">
                      →
                    </button>
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
