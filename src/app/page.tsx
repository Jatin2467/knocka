import { ComingSoon, comingSoonMetadata } from "@/components/coming-soon";

/*
  TEMPORARY: `/` shows the Coming Soon page, with its own title and
  descriptions. The landing page is untouched in components/landing.

  To bring the landing page back, replace this whole file with:

    import { LandingPage } from "@/components/landing/LandingPage";

    export default function Home() {
      return <LandingPage />;
    }

  Not a flag, on purpose: importing LandingPage here at all — even behind a
  `false` — puts its client code (AOS, framer-motion, the music player) in
  this route's bundle. See docs/COMING_SOON.md.
*/

export const metadata = comingSoonMetadata;

export default function Home() {
  return <ComingSoon />;
}
