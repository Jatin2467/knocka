import { DNAAnimation } from "@/components/animation/DNAAnimation";
import { SiteHeader } from "@/components/navigation";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Rooms } from "@/components/sections/Rooms";

export default function Home() {
  return (
    <main className="knocka-page">
      <DNAAnimation />
      <SiteHeader />
      <Hero />
      <Rooms />
      <Footer />
    </main>
  );
}
