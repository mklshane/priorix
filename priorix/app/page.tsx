import Features from "@/components/Features";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <div className="h-screen bg-white noise">
        {" "}
        <Navbar />
        <Hero />
      </div>
      <div className="w-[30%] h-0.5 bg-black mx-auto rounded-4xl">
      </div>
      <Features />
    </div>
  );
}
