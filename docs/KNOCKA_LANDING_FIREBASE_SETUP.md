# Knocka landing page — Firebase setup

Status: **database and rules live; App Hosting backend `knocka` exists but is running an old commit (no env, no waitlist config). This repo's work is not committed or pushed yet.** Last updated 2026-10-01.

## 1. Architecture

```
Browser ── Next.js 16 (Firebase App Hosting, Cloud Run)
              └─ POST /api/waitlist
                    ├─ Nodemailer (SMTP)  → owner notification + visitor confirmation
                    └─ Firebase Admin SDK → Firestore database "knocka-landing"
```

- The landing page is **separate from the mobile apps**. It shares only the Firebase project.
- The browser never talks to Firestore. All writes go through the server route.

## 2. Firebase project

- Project ID: `knocka-75c63` (project number `7245529143`). Do not create another.

## 3. Firebase Web App (reused, not duplicated)

- Name: `knocka landingpage`
- App ID: `1:7245529143:web:1393c32a1bc69c33753fb2`
- Config lives in `NEXT_PUBLIC_FIREBASE_*` (see section 6). Client init: `src/lib/firebase.ts` (single `getApps()` guard; Analytics is loaded on demand and not used yet).

## 4. Firestore databases

| Database | Location | Used by |
| --- | --- | --- |
| `(default)` | `nam5` | **Mobile apps. Never touched by this repo.** |
| `knocka-landing` | `nam5` | Landing waitlist. Created 2026-10-01, Standard/Native, deletion protection on. Rules deployed (deny-all for clients). |

- Server code: `src/lib/server/landing-firestore.ts` returns a handle **only** when `FIRESTORE_DATABASE_ID` is set, and **refuses** `(default)`. With the variable unset the Firestore write is skipped and email still works. `apphosting.yaml` sets it to `knocka-landing`.
- Credentials: Application Default Credentials. On App Hosting this is the backend's service account `firebase-app-hosting-compute@knocka-75c63.iam.gserviceaccount.com` (no key file). It already holds `roles/firebase.sdkAdminServiceAgent`, which includes the Firestore entity permissions, so no extra IAM grant is needed. Note IAM is project-wide: the guard in code, not IAM, is what keeps the site off `(default)`. Locally: `gcloud auth application-default login`.
- Data model: `waitlist/{email}` → `email`, `source`, `userAgent`, `createdAt`. The email is the document ID, so a repeat signup cannot create a second record.
- Rules: `firestore.landing.rules` is **deny-all** for the client (the Admin SDK bypasses rules). The public can't read, create, update or delete anything. These rules are for `knocka-landing` only.

## 5. App Hosting status

- Backend (created in the console): ID `knocka`, region `us-east4`, URL `https://knocka--knocka-75c63.us-east4.hosted.app`, repo `Jatin2467/knocka`, **live branch `main`**, root directory `/`.
- Its first rollout (commit `1a4a2e5`, before any of this work) succeeded. That build had no `apphosting.yaml`, so it has no env vars and `/api/waitlist` answers 503 there.
- Files ready: `firebase.json` (backend `knocka`, plus the landing-database rules entry), `.firebaserc` (default → `knocka-75c63`), `apphosting.yaml` (scale 0–2, public Firebase env, `FIRESTORE_DATABASE_ID=knocka-landing`, SMTP block commented out until the secret exists).
- A push to `main` triggers a build and rollout automatically. Nothing is committed or pushed yet.
- The console also registered a second Firebase web app, `knocka` (`1:7245529143:web:5d38703b82b7fd64753fb2`), for the backend. The site uses the original `knocka landingpage` app via `NEXT_PUBLIC_FIREBASE_APP_ID`; the extra one is harmless.

## 6. Environment variables

**A. Public (non-secret) — safe in `apphosting.yaml` / `.env.example`**

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | in `.env.example` (public identifier) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `knocka-75c63.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | `https://knocka-75c63-default-rtdb.firebaseio.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `knocka-75c63` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `knocka-75c63.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `7245529143` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:7245529143:web:1393c32a1bc69c33753fb2` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-7DNBZYVXPR` |

Needed at **BUILD and RUNTIME** (Next inlines `NEXT_PUBLIC_` at build). Already in `apphosting.yaml`.

**B. Server, non-secret — App Hosting env, RUNTIME**

| Variable | Required | Notes |
| --- | --- | --- |
| `SMTP_HOST` | yes | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | no (465) | |
| `SMTP_USER` | yes | sending account |
| `MAIL_FROM` | no | defaults to `"Knocka" <SMTP_USER>` |
| `WAITLIST_OWNER_EMAIL` | yes | gets each signup notification |
| `SMTP_SECURE` | no | `true`/`false` override |
| `FIRESTORE_DATABASE_ID` | for Firestore | `knocka-landing` once approved; **never `(default)`** |

**C. Secrets — Firebase Secret Manager**

| Variable | Value |
| --- | --- |
| `SMTP_PASS` | `<SECRET — configure in Firebase/App Hosting>` (Gmail App Password) |

## 7. Setting the secret

```
firebase apphosting:secrets:set SMTP_PASS --project knocka-75c63
```
Paste the value when prompted (it is not echoed or stored in the repo) and grant backend `knocka` access when asked. Only then uncomment in `apphosting.yaml` (a reference to a missing secret fails the rollout):
```yaml
- variable: SMTP_PASS
  secret: SMTP_PASS
  availability: [RUNTIME]
```
Never put the value in `apphosting.yaml`, `.env.example` or Git. Local development uses `.env.local` (git-ignored).

## 8. Waitlist behavior

The record is written first; it decides what happens next. Nodemailer is unchanged. No referral, reward or counter features yet.

| Case | Record | Email | Response |
| --- | --- | --- | --- |
| New address | created | owner notification + visitor confirmation (2 messages) | `{ ok: true, offerPhone: true }` |
| Address already on the list | none | **none** | `{ ok: true }` |
| New address, daily mail cap spent | created | none (logged: `Daily mail cap reached`) | `{ ok: true, offerPhone: true }` |
| New address, SMTP fails | created | logged (sanitised) | `{ ok: true, offerPhone: true }` |
| Firestore write fails | none | none | 502, generic message |
| Production without `FIRESTORE_DATABASE_ID` | none | none | 503 "paused" (fails closed: no duplicate check and no shared cap without the database) |

**Outbound mail cap.** Every instance reserves its messages from one counter in the landing database, `mailQuota/{UTC date}` (field `sent`), inside a transaction, before it sends. Default 300 messages a day (2 per signup, so 150 signups), under Gmail's roughly 500. Override with `WAITLIST_MAIL_DAILY_CAP`. `WAITLIST_MAIL_QUOTA_SCOPE` prefixes the counter's ID so a test can use its own; never set it in production. One small document per day accumulates; delete old ones whenever you like.

**Who is the visitor (rate limiting).** `X-Forwarded-For` is never used: its leftmost value is whatever the sender typed. The limiter's identity is the `x-fah-client-ip` header that App Hosting's proxy reportedly sets (per a third-party source, not Firebase's own documentation; verified on each deploy, see below), believed only when `FIREBASE_CONFIG` is present (set by the platform at runtime, never by a visitor). Missing or invalid header means one shared "unidentified" bucket (too strict, never unlimited); IPv6 visitors are bucketed by /64; outside App Hosting everything is one "local" bucket. Limits: 5 attempts per visitor per 10 minutes on each of the two routes, plus a 300 per 10 minutes per-instance ceiling on `/api/waitlist` whoever is asking. Counters are per instance (App Hosting runs up to 2), so they are a first line only; the Firestore mail cap is the shared one.

**Verify after every deploy that the platform really overwrites the header.** From any machine, send 6 requests with an invalid email and a different forged `x-fah-client-ip: 10.7.7.N` each: `curl -s -o /dev/null -w "%{http_code} " -X POST <site>/api/waitlist -H 'content-type: application/json' -H "x-fah-client-ip: 10.7.7.$i" -d '{"email":"not-an-email","source":"footer"}'`. If the platform overwrites the header, all six share your real identity and the **6th returns 429**. If the 6th returns 400, the header can be forged: stop and switch the identity source. (Invalid emails change nothing; wait 10 minutes before repeating.)

**Mail logging.** Each message logs one line: `[waitlist] Mail stage=send to=owner|confirmation accepted. reply="250 …"` or `… failed. code=… smtp=… message="…"`. Only the code, SMTP reply code, command and first message line are logged, with `SMTP_PASS` redacted. Read them in Cloud Logging for Cloud Run service `knocka` (us-east4). A Gmail login failure shows as `535-5.7.8 Username and Password not accepted`: the `SMTP_PASS` secret is not a valid App Password. Fix by re-running `firebase apphosting:secrets:set SMTP_PASS` and starting a new rollout, because a rollout pins the secret version it was built with.

**Step 2: optional mobile number (collect and store only; no SMS is sent and no SMS provider is connected).**
- After a *new* signup the API answers `{ ok: true, offerPhone: true }` and the form shows "You're on the Knocka list!" with an optional number and SMS consent. A repeat of an existing address gets plain `{ ok: true }` and no step 2.
- The form has a country picker (all 245 countries from libphonenumber-js, with dial codes; the browser's language picks the default) and the number. **No OTP and no verification.**
- `POST /api/waitlist/phone` `{ email, phoneNumber, phoneCountry, smsConsent: true }` updates the same `waitlist/{email}` record, writing only `phoneNumber` (E.164, e.g. `+12015550123`), `phoneCountry` (ISO code, e.g. `US`), `smsOptIn: true` and `smsConsentAt` (server timestamp, set only because consent was ticked). Email, source, userAgent and createdAt are never touched. Browsers still have no Firestore access. Older records with a number but no `phoneCountry` stay valid.
- Validation uses libphonenumber-js: the number must be valid for the picked country (a `+` number must carry that country's code), and known non-mobile line types (landline, toll-free, premium) are refused. The browser checks with the small `min` metadata (loaded only after step 1); the server checks again with the full `max` metadata and decides.
- The number can be added once, within 30 minutes of signup, on a record that has none. Any other case (no such record, too old, already has a number) answers the same generic 409.
- Nothing is verified by text, so anyone can type any number. Before sending any SMS, add a double opt-in.

## 9. Share Knocka

`src/components/sections/Share/` — native Web Share API where supported; WhatsApp (`wa.me`), Email (`mailto:`), Instagram/TikTok (copy link, then open the app) and Copy link everywhere. Shares only the site URL. No WhatsApp API, referrals or rewards.

## 10. Still to do (needs approval)

1. ~~Create database `knocka-landing`~~ done. ~~Deploy its rules~~ done. ~~Create the backend~~ done (`knocka`).
2. ~~Create the `SMTP_PASS` secret~~ done (Secret Manager, version 1; the backend's service account can read it; referenced in `apphosting.yaml`). Non-secret mail settings are set in `apphosting.yaml` (Gmail `smtp.gmail.com:465`; sender, `MAIL_FROM` and owner are `jatin.apl1234@gmail.com`). `SMTP_SECURE` is intentionally unset (port 465 implies TLS). If any of these is missing at runtime, `/api/waitlist` answers 503.
3. Commit this work and push to `main`. That starts the rollout. (Or, from this repo: `firebase deploy --only apphosting`.)
4. After the rollout, submit one test signup on the live URL and check `waitlist/` in `knocka-landing`; delete the test document.
5. Add the custom domain in App Hosting when ready.

## 11. Safety rules

- Never touch the `(default)` database, its rules, the mobile app's functions, auth, storage or notifications.
- Never commit service-account JSON, private keys or SMTP passwords.
- Never run a bare `firebase deploy`; always pass `--only`.
- Do not connect the client organisation's repository.

## 12. Current next step

Provide the production SMTP sender and password (step 2 above), then approve the commit and push to `main`.
