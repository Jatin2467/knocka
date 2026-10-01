/**
 * The phone rules, shared by the form (client) and the route (server).
 *
 * The rules live here once; each side supplies a "phone engine" built on
 * libphonenumber-js, so the browser can ship the small `min` metadata while the
 * server checks against the full `max` metadata. This file imports only types,
 * so it pulls no metadata into either bundle.
 */
import type { CountryCode, PhoneNumber } from "libphonenumber-js";

export type { CountryCode };

export interface PhoneEngine {
  parse(text: string, country: CountryCode): PhoneNumber | undefined;
  /** "1" for US, "44" for GB, ... */
  callingCode(country: CountryCode): string;
  /** Is this a country libphonenumber knows? */
  isCountry(value: string): value is CountryCode;
  /** Extra, engine-specific refusal (the server rejects non-mobile line types). */
  rejects?(number: PhoneNumber): boolean;
}

export interface NormalizedPhone {
  /** E.164, e.g. `+12015550123`. */
  e164: string;
  country: CountryCode;
}

/**
 * Turn what the visitor typed, plus the country they picked, into E.164, or
 * null. A number that merely contains digits is not enough: it has to be a
 * valid number for the country, and if it carries its own `+` country code
 * that code has to be the picked country's.
 */
export function normalizePhone(
  engine: PhoneEngine,
  input: unknown,
  country: unknown,
): NormalizedPhone | null {
  if (typeof input !== "string" || typeof country !== "string") return null;
  if (!engine.isCountry(country)) return null;

  const text = input.trim();
  if (text.length === 0 || text.length > 32) return null;
  if (!/^\+?[\d\s().-]+$/.test(text)) return null;

  const parsed = engine.parse(text, country);
  if (!parsed || !parsed.isValid()) return null;
  if (parsed.countryCallingCode !== engine.callingCode(country)) return null;
  if (engine.rejects?.(parsed)) return null;

  return { e164: parsed.number, country };
}
