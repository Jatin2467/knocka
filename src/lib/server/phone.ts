import "server-only";

import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";

import {
  normalizePhone as normalizeWith,
  type NormalizedPhone,
  type PhoneEngine,
} from "@/lib/phone-shared";

/**
 * The server's phone check: the full `max` metadata, which knows each
 * country's real number patterns and line types. This is the authority; the
 * browser's check is only a courtesy.
 */

const KNOWN = new Set<string>(getCountries());

/** Line types that cannot receive a text from a person. */
const NOT_TEXTABLE = new Set([
  "FIXED_LINE",
  "TOLL_FREE",
  "PREMIUM_RATE",
  "SHARED_COST",
  "PAGER",
  "UAN",
  "VOICEMAIL",
]);

const engine: PhoneEngine = {
  parse: (text, country) => parsePhoneNumberFromString(text, country),
  callingCode: (country) => getCountryCallingCode(country),
  isCountry: (value): value is CountryCode => KNOWN.has(value),
  rejects: (number) => NOT_TEXTABLE.has(String(number.getType())),
};

export function normalizePhone(input: unknown, country: unknown): NormalizedPhone | null {
  return normalizeWith(engine, input, country);
}
