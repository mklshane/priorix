"use client";
import React, { useState } from "react";

interface Feature {
  name: string;
  color: string;
  description: string;
  details: string;
  benefits: string[];
}

const Features: React.FC = () => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features: Feature[] = [
    {
      name: "Flashcard",
      color: "bg-pink",
      description:
        "Create interactive flashcards for effective spaced repetition learning",
      details:
        "Smart algorithms track your progress and optimize review timing",
      benefits: ["Memory retention", "Quick reviews", "Flashcards Generation"],
    },
    {
      name: "Notes",
      color: "bg-green",
      description:
        "Rich text editor with markdown support and organization tools",
      details:
        "Tag, search, and link your notes for seamless knowledge management",
      benefits: ["Rich formatting", "Easy organization", "Quick search"],
    },
    {
      name: "To Do",
      color: "bg-yellow ",
      description: "Smart task management with deadlines and priority levels",
      details: "Set reminders, track progress, and stay on top of your goals",
      benefits: [
        "Priority management",
        "Deadline tracking",
        "Progress monitoring",
      ],
    },
  ];

  return (
    <div
      className="w-[85%] min-h-[50%] flex flex-col items-center mx-auto mb-23"
      id="features"
    >
      <div className="mt-20 flex flex-col items-center gap-10">
        <div className="text-center">
          <p className="font-lora italic text-4xl tracking-wide mb-3">
            Features
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-course-pink via-course-blue to-course-yellow rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4 max-w-2xl text-lg">
            Powerful tools designed to enhance your learning experience and
            boost productivity
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8 w-full">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`relative ${feature.color} noise
                          px-8 py-10 rounded-4xl flex flex-col items-center border-2 border-black
                          shadow-lg backdrop-blur-sm transition-all duration-500 ease-out
                          cursor-pointer group overflow-hidden ${
                            hoveredFeature === index
                              ? "-translate-y-3 shadow-2xl shadow-black/20 scale-105"
                              : ""
                          }`}
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              {/* Animated background overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-foreground/10 to-transparent opacity-0 
                              group-hover:opacity-100 transition-opacity duration-500"
              ></div>

              {/* Floating particles effect */}
              <div
                className="absolute -top-2 -right-2 w-4 h-4 bg-foreground/30 rounded-full 
                              animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              ></div>
              <div
                className="absolute -bottom-1 -left-1 w-3 h-3 bg-foreground/20 rounded-full 
                              animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              ></div>

              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Feature name */}
                <h3 className="font-sora text-xl font-bold text-foreground mb-4">
                  {feature.name}
                </h3>

                {/* Description */}
                <p className="text-foreground/90 text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Expandable details */}
                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    hoveredFeature === index
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="border-t border-foreground/30 pt-4 mt-2">
                    <p className="text-foreground/80 text-xs italic mb-3">
                      {feature.details}
                    </p>

                    <div className="flex flex-wrap gap-2 justify-center">
                      {feature.benefits.map((benefit, idx) => (
                        <span
                          key={idx}
                          className="bg-foreground/20 text-foreground text-xs px-2 py-1 rounded-full
                                     backdrop-blur-sm border border-foreground/20"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Call to action hint */}
                <div
                  className={`transition-all duration-300 ${
                    hoveredFeature === index
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  }`}
                >
                  
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom accent */}
        <div className="flex gap-2 mt-8">
          {features.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                hoveredFeature === index
                  ? "bg-gradient-to-r from-pink to-blue scale-125"
                  : "bg-gray-300"
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
