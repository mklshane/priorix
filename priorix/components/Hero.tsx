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

       
        <div className="lg:w-1/2 flex justify-center w-full max-w-md lg:max-w-lg mt-8 lg:mt-0">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96">
       
            <div className="absolute -inset-3 sm:-inset-4 md:-inset-5 bg-gradient-to-r from-purple to-pink blur-lg opacity-20 dark:opacity-30 rounded-3xl"></div>

         
            <div
              className="relative w-full h-full"
              onMouseEnter={() => setIsStackHovered(true)}
              onMouseLeave={() => setIsStackHovered(false)}
            >
            
              <div
                className={`absolute w-full h-full bg-gradient-to-br from-violet/10 to-purple/10 rounded-xl border border-violet/15 shadow-sm transition-all duration-500 ${
                  isStackHovered
                    ? "-translate-x-6 -translate-y-4 -rotate-6"
                    : "-bottom-2 -right-2 rotate-2"
                }`}
              ></div>

            
              <div
                className={`absolute w-full h-full bg-gradient-to-br from-violet/15 to-purple/15 rounded-xl border border-violet/20 shadow-md transition-all duration-500 ${
                  isStackHovered
                    ? "-translate-x-4 -translate-y-3 -rotate-3"
                    : "-bottom-1 -right-1 rotate-1"
                }`}
              >
                <div className="p-4 h-full flex flex-col opacity-80">
                  <div className="text-center mb-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 mx-auto rounded-full bg-violet/20 flex items-center justify-center">
                      <span className="text-violet text-sm md:text-lg font-bold">
                        ∫
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xs md:text-sm text-violet mb-1">
                        CALCULUS
                      </div>
                      <div className="h-2 md:h-3 bg-violet/20 rounded-full w-20 md:w-24 mx-auto mb-2"></div>
                      <div className="h-1 md:h-2 bg-violet/15 rounded-full w-16 md:w-20 mx-auto"></div>
                    </div>
                  </div>
                  <div className="h-1 md:h-2 bg-violet/10 rounded-full w-full"></div>
                </div>
              </div>

            
              <div
                className={`absolute w-full h-full bg-gradient-to-br from-violet/20 to-purple/20 rounded-xl border border-violet/25 shadow-md transition-all duration-500 ${
                  isStackHovered
                    ? "-translate-x-2 -translate-y-1"
                    : "bottom-0 right-0"
                }`}
              >
                <div className="p-4 h-full flex flex-col opacity-85">
                  <div className="text-center mb-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 mx-auto rounded-full bg-pink/20 flex items-center justify-center">
                      <span className="text-pink text-sm md:text-lg font-bold">
                        🏛
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xs md:text-sm text-pink mb-1">
                        HISTORY
                      </div>
                      <div className="h-2 md:h-3 bg-pink/20 rounded-full w-24 md:w-28 mx-auto mb-2"></div>
                      <div className="h-1 md:h-2 bg-pink/15 rounded-full w-12 md:w-16 mx-auto"></div>
                    </div>
                  </div>
                  <div className="h-1 md:h-2 bg-pink/10 rounded-full w-full"></div>
                </div>
              </div>

              
              <div
                className={`absolute w-full h-full bg-gradient-to-br from-pink/25 to-purple/25 rounded-xl border border-pink/30 shadow-lg transition-all duration-500 ${
                  isStackHovered
                    ? "-translate-x-1 translate-y-1 rotate-2"
                    : "top-1 left-1 -rotate-1"
                }`}
              >
                <div className="p-4 h-full flex flex-col">
                  <div className="text-center mb-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 mx-auto rounded-full bg-green/20 flex items-center justify-center">
                      <span className="text-green text-sm md:text-lg font-bold">
                        🔤
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xs md:text-sm text-green mb-1">
                        LANGUAGE
                      </div>
                      <div className="h-2 md:h-3 bg-green/20 rounded-full w-28 md:w-32 mx-auto mb-2"></div>
                      <div className="h-1 md:h-2 bg-green/15 rounded-full w-20 md:w-24 mx-auto"></div>
                    </div>
                  </div>
                  <div className="h-1 md:h-2 bg-green/10 rounded-full w-full"></div>
                </div>
              </div>

              
              <div
                className={`absolute w-full h-full bg-white dark:bg-gray-800 rounded-xl border border-violet/30 shadow-xl transition-all duration-500 ${
                  isStackHovered
                    ? "translate-x-1 translate-y-2 rotate-3"
                    : "top-2 left-2 -rotate-2"
                }`}
              >
                <div className="p-4 md:p-5 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="text-xs md:text-sm text-muted-foreground">
                      12 cards
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 md:space-y-6">
                    <div className="flex items-center justify-center">
                     
                    </div>

                    <div className="space-y-1 md:space-y-2">
                      <div className="h-2 md:h-3 bg-violet/10 rounded-full w-full"></div>
                      <div className="h-2 md:h-3 bg-violet/10 rounded-full w-3/4 mx-auto"></div>
                      <div className="h-2 md:h-3 bg-violet/10 rounded-full w-1/2 mx-auto"></div>
                    </div>

                    <div className="bg-violet/5 p-2 md:p-3 rounded-lg border border-violet/10">
                      <div className="flex justify-between items-center mb-1 md:mb-2">
                        <div className="h-1 md:h-2 bg-violet/20 rounded-full w-1/4"></div>
                        <div className="h-1 md:h-2 bg-green/20 rounded-full w-1/6"></div>
                      </div>
                      <div className="h-1 md:h-2 bg-violet/20 rounded-full w-full mb-1 md:mb-2"></div>
                      <div className="h-1 md:h-2 bg-green/20 rounded-full w-3/4"></div>
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
