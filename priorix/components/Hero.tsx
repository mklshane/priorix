"use client"
import { useRouter } from "next/navigation";
import React from "react";

const Hero = () => {
  const router = useRouter();
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
            onClick={() => { router.push('/signup') }}
            className="bg-green hover:bg-green/90 text-primary font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-violet/25">
              Get Started Free
            </button>
            
          </div>

         
        </div>

        {/* Right Content - App Illustration */}
        <div className="md:w-1/2 flex justify-center w-full">
          <div className="relative w-full">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple to-pink blur-lg opacity-20 dark:opacity-30 rounded-3xl"></div>
            <div className="relative bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
              <div className="bg-muted border-b border-border px-4 py-3 flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow"></div>
                <div className="w-3 h-3 rounded-full bg-green"></div>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-violet/20 rounded-full w-3/5"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded-full w-1/5"></div>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="flex items-center">
                        <div className="h-4 w-4 rounded border border-violet/30 mr-3"></div>
                        <div className="h-3 bg-muted-foreground/10 rounded-full w-full"></div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-perry/10 p-3 rounded-lg border border-perry/20">
                    <div className="flex justify-between items-center mb-2">
                      <div className="h-2 bg-perry/30 rounded-full w-1/4"></div>
                      <div className="h-2 bg-perry/30 rounded-full w-1/6"></div>
                    </div>
                    <div className="h-2 bg-perry/30 rounded-full w-full mb-2"></div>
                    <div className="h-2 bg-perry/30 rounded-full w-3/4"></div>
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
