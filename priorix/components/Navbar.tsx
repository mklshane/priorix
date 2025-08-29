import Link from "next/link";
import React from "react";

const Navbar: React.FC = () => {
  return (
    <div className="w-full flex justify-between items-center px-10 py-6 ">
      <p className="text-2xl font-lora italic">Priorix</p>
      <div className="flex gap-8 border-2 rounded-4xl px-10 py-2 bg-course-khaki ">
        <Link href="#features">Features</Link>
        <Link href="">Pricing</Link>
        <Link href="">Docs</Link>
        <Link href="">Contact</Link>
      </div>
      <Link href={"/login"}>
      <button className="bg-course-pink px-5 py-2 rounded-4xl text-sm border-2 text-secondary-foreground font-semibold font-sora hover:bg-primary-foreground">
        Log In
      </button></Link>
    </div>
  );
};

export default Navbar;
