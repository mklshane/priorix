import Features from "@/components/Features";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <div className="h-screen bg-primary-foreground noise">
        {" "}
        <Navbar />
        <Hero />
      </div>
      <Features />
    </div>
  );
}
