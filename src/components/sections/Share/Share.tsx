import Image from "next/image";

import { ShareActions } from "./ShareActions";

/** Three of the cast, overlapped, to make the ask feel like sending it to someone. */
const FACES = [
  { src: "/avatar-profile-img/avatar1.png", alt: "" },
  { src: "/avatar-profile-img/avatar3.png", alt: "" },
  { src: "/avatar-profile-img/avatar6.png", alt: "" },
] as const;

/**
 * SHARE KNOCKA — the quiet beat between the invite banner and the footer.
 *
 * The banner asks for an email; this asks for a favour. It is a glass panel in
 * the footer's own language rather than another poster section, so it reads as
 * part of the page's close. The left side is the ask — a heading, a line, and
 * a small knock from the cast; the right is the way to do it, one tap per app.
 * Phase 2 shares the plain site URL only — no referral codes yet.
 *
 * A server component: the copy is static and the reveals are AOS. The
 * controls are a client component of their own (`ShareActions`).
 */
export function Share() {
  return (
    <section className="share" id="share" aria-labelledby="share-title">
      <div className="share-panel" data-aos="knocka-zoom">
        <span className="share-orb share-orb-a" aria-hidden="true" />
        <span className="share-orb share-orb-b" aria-hidden="true" />

        <div className="share-copy">
          <p className="share-eyebrow" data-aos="knocka-rise">
            <span aria-hidden="true">✦</span> Spread the word
          </p>
          <h2
            className="share-title delay-[60ms]"
            id="share-title"
            data-aos="knocka-heading"
          >
            Share it with <span className="text-gradient">your friends.</span>
          </h2>
          <p className="share-lead delay-[120ms]" data-aos="knocka-rise">
            Knocka is better when someone is there to knock back. Send it to the
            one person you&apos;d want to knock first.
          </p>

          <div className="share-knock delay-[200ms]" data-aos="knocka-rise">
            <span className="share-faces" aria-hidden="true">
              {FACES.map((face) => (
                <Image
                  key={face.src}
                  src={face.src}
                  alt={face.alt}
                  width={96}
                  height={96}
                  className="share-face"
                />
              ))}
            </span>
            <span className="share-bubble">
              <span>
                Knock knock <span aria-hidden="true">👊</span>
              </span>
              <small>Try Knocka with me?</small>
            </span>
          </div>
        </div>

        <div className="share-side delay-[180ms]" data-aos="knocka-rise">
          <ShareActions />
        </div>
      </div>
    </section>
  );
}
