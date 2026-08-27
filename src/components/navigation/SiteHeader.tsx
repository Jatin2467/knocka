import { Button } from "@/components/ui/Button";
import { navLinks, siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  return (
    <header className="navbar">
      <a href="#" className="logo">
        {siteConfig.name} <span className="logo-mark">✦</span>
      </a>

      <nav className="nav-links">
        {navLinks.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <div className="nav-actions">
        <Button variant="ghost">Glass Matrix</Button>
        <Button variant="primary">Join Waitlist →</Button>
      </div>
    </header>
  );
}
