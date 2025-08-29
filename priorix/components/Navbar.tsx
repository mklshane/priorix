import Link from "next/link";
import React from "react";

const Navbar: React.FC = () => {
  return (
    <div className="relative w-full flex items-center px-10 py-6">
      <p className="text-2xl font-lora italic">Priorix</p>

      <div className="absolute left-1/2 -translate-x-1/2 flex gap-8 border-2 rounded-4xl px-10 py-2 bg-transparent">
        <Link href="#features">Features</Link>
        <Link href="">Pricing</Link>
        <Link href="">Docs</Link>
        <Link href="">Contact</Link>
      </div>

      <div className="ml-auto flex gap-2">
        <Link href={"/login"}>
          <button className="bg-course-pink px-5 py-2 rounded-4xl text-sm border-2 text-secondary-foreground font-semibold font-sora hover:bg-primary-foreground">
            Log In
          </button>
        </Link>
        <Link href={"/signup"}>
          <button className="bg-course-khaki px-3 py-2 rounded-4xl text-sm border-2 text-secondary-foreground font-semibold font-sora hover:bg-primary-foreground">
            Get Started
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
