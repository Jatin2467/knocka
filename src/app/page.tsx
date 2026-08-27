import { DNAAnimation } from "@/components/animation/DNAAnimation";
import { SiteHeader } from "@/components/navigation";
import { Hero } from "@/components/sections/Hero";

export default function Home() {
  return (
    <main className="knocka-page">
      <DNAAnimation />
      <SiteHeader />
      <Hero />
    </main>
  );
}
