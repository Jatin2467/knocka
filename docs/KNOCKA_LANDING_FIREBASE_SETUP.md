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

Email and Firestore run in parallel. A signup succeeds if **either** recorded it; only if both fail does the visitor see an error. Nodemailer is unchanged. No phone, referral, reward or counter features yet.

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
