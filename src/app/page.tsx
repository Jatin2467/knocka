import { DNAAnimation } from "@/components/animation/DNAAnimation";
import { SiteHeader } from "@/components/navigation";
import { Arrival } from "@/components/sections/Arrival";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Range } from "@/components/sections/Range";
import { Rooms } from "@/components/sections/Rooms";

export default function Home() {
  return (
    <main className="knocka-page">
      <DNAAnimation />
      <SiteHeader />
      <Hero />
      <Arrival />
      <Range />
      <Rooms />
      <Footer />
    </main>
  );
}
