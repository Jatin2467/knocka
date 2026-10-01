import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";

import {
  normalizePhone as normalizeWith,
  type NormalizedPhone,
  type PhoneEngine,
} from "@/lib/phone-shared";

/**
 * Browser side of the phone step: the country list and a quick check, on the
 * small `min` metadata. The server checks again with the full metadata
 * (lib/server/phone.ts) and is the one that decides.
 */

const KNOWN = new Set<string>(getCountries());

const engine: PhoneEngine = {
  parse: (text, country) => parsePhoneNumberFromString(text, country),
  callingCode: (country) => getCountryCallingCode(country),
  isCountry: (value): value is CountryCode => KNOWN.has(value),
};

export function normalizePhone(input: unknown, country: unknown): NormalizedPhone | null {
  return normalizeWith(engine, input, country);
}

export type { CountryCode };

export interface CountryOption {
  code: CountryCode;
  /** "United States" */
  name: string;
  /** "+1" */
  dial: string;
}

/** Shown first, in this order, because they are the likeliest launch markets. */
const FIRST: CountryCode[] = ["US", "CA", "GB", "AU"];

/** Every country, by English name, with its dial code. Names come from the browser's own region names. */
export function countryOptions(): CountryOption[] {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    // Very old browsers: fall back to the two-letter code.
  }
  const all = getCountries().map((code) => ({
    code,
    name: names?.of(code) ?? code,
    dial: `+${getCountryCallingCode(code)}`,
  }));
  const rest = all
    .filter((c) => !FIRST.includes(c.code))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
  const first = FIRST.map((code) => all.find((c) => c.code === code)).filter(
    (c): c is CountryOption => Boolean(c),
  );
  return [...first, ...rest];
}

/** The visitor's likely country from their browser language ("en-GB" -> GB), else US. */
export function guessCountry(language: string | undefined): CountryCode {
  const region = language?.split("-")[1]?.toUpperCase();
  return region && KNOWN.has(region) ? (region as CountryCode) : "US";
}
