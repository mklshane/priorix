import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <div className="h-screen bg-course-blue noise">
        {" "}
        <Navbar />
        <Hero />

      </div>
    </div>
  );
}
