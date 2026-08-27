import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow">
          <span>✦</span> Messages that feel human
        </div>

        <h1 className="hero-title">
          Feel the <br />
          <span className="text-gradient">message.</span>
        </h1>

        <p className="hero-description">
          Don&apos;t text. Arrive. Knocka lets your avatar deliver messages with
          emotion, voice, movement, and presence.
        </p>

        <Button variant="primary" size="lg">
          Join the Waitlist →
        </Button>
      </div>

      <div className="hero-video-wrapper glow">
        <div className="hero-video">
          <div className="avatar-bubble">👤</div>
          <span className="avatar-status">AVATAR STREAM READY</span>
        </div>
      </div>
    </section>
  );
}
