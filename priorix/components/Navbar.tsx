import Link from "next/link";
import React from "react";

const Navbar: React.FC = () => {
  return (
    <div className="relative w-full flex items-center px-8 md:px-20 py-6">
      <p className="text-2xl font-lora italic">Priorix</p>

      {/* <div className=" absolute left-1/2 -translate-x-1/2 flex gap-8 border-2 border-black rounded-4xl px-10 py-2 bg-transparent">
        <Link href="#features">Features</Link>
        <Link href="">Pricing</Link>
        <Link href="">Docs</Link>
        <Link href="">Contact</Link>
      </div> */}

      <div className="ml-auto flex gap-3">
        <Link href={"/login"}>
          <button className="btn-base btn-hover btn-active btn-pink btn-size-md">
            Log In
          </button>
        </Link>
        <Link href={"/signup"}>
          <button className="btn-base btn-hover btn-active btn-green btn-size-md ">
            Get Started
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
