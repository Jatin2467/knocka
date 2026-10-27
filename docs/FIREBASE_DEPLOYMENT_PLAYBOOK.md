# Firebase App Hosting — deployment playbook

How this site is deployed, how to ship a change safely, and how to set up the same thing for a new project. Part A is about Knocka. Part B is the reusable recipe.

Never put a password, App Password, service-account key or debug token in this file or anywhere in Git.

---

## Part A — Knocka landing page

### A1. Quick reference

| Item | Value |
| --- | --- |
| Firebase project | `knocka-75c63` (shared with the Knocka mobile apps) |
| Repo / live branch | `github.com/Jatin2467/knocka`, branch `main` |
| App Hosting backend | `knocka`, region `us-east4`, root dir `/` |
| Live URL | https://knocka--knocka-75c63.us-east4.hosted.app |
| Runtime service account | `firebase-app-hosting-compute@knocka-75c63.iam.gserviceaccount.com` |
| Cloud Run service (logs) | `knocka` in `us-east4` |
| Firestore database (site) | `knocka-landing` (nam5, deletion protection on, deny-all client rules) |
| Firestore database (apps) | `(default)`: **mobile apps only, never touch** |
| Secrets (Secret Manager) | `SMTP_PASS` (Gmail App Password) |
| App Check | reCAPTCHA Enterprise key `knocka landingpage` (web, score-based). Enforced on `/api/waitlist*` only, via `APP_CHECK_ENFORCE` |
| Config files | `apphosting.yaml`, `firebase.json`, `.firebaserc`, `firestore.landing.rules` |
| Waitlist details | `docs/KNOCKA_LANDING_FIREBASE_SETUP.md` |

### A2. How a deploy happens

```
git push origin main
  └─ App Hosting sees the new commit on the live branch
       └─ Build (Cloud Build): npm install + next build
            NEXT_PUBLIC_* values from apphosting.yaml (BUILD) are inlined here
       └─ Rollout: a new Cloud Run revision gets 100% of traffic
            RUNTIME env and secrets are attached here
            (a rollout pins the secret VERSION it was built with)
```

Each push to `main` gets one build (`build-YYYY-MM-DD-NNN`) and one rollout (`rollout-YYYY-MM-DD-NNN`). A full build and rollout takes about 5–8 minutes. If the build fails, the previous revision keeps serving.

### A3. Shipping a change (checklist)

**Before you push**
1. `npm run lint` and `npx tsc --noEmit`.
2. `npm run build`. A push triggers this same build, so catch failures locally.
3. For UI changes, check at 320, 375, 768, 1024 and 1440 px, with **production-like data**. The share section once looked fine locally and broke live because the hosted.app URL is much longer than `localhost:3000`.
4. `git status`: make sure no `.env*` or key files are staged.

**Ship**
```bash
git add <files>
git commit -m "..."
git push origin main
```

**Watch**
```bash
firebase apphosting:rollouts:list knocka --project knocka-75c63
```
You can also open the Firebase console > App Hosting > `knocka` > Rollouts. Wait for `SUCCEEDED`.

**Verify on the live URL**
- The page loads, and the change is visible (hard refresh).
- Calling the API with no App Check token is still refused:
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://knocka--knocka-75c63.us-east4.hosted.app/api/waitlist \
    -H "content-type: application/json" -d '{"email":"not-an-email","source":"footer"}'
  ```
  Expect `403`.
- If you touched the waitlist, do one real signup. Check the record in `knocka-landing` > `waitlist`, check both emails, then delete the test record.

**Roll back**
- In the console: App Hosting > `knocka` > Rollouts > pick an earlier rollout and roll back.
- With the CLI:
  ```bash
  firebase apphosting:rollouts:create knocka --git-commit <good-sha> --project knocka-75c63
  ```
  This rebuilds that commit using **that commit's** `apphosting.yaml`.
- The long-term fix is to `git revert <bad-sha>` and push.

### A4. Changing configuration

| Change | How | Then |
| --- | --- | --- |
| Public or plain env var | Edit `apphosting.yaml` | Commit and push |
| Secret value (e.g. new Gmail App Password) | `firebase apphosting:secrets:set SMTP_PASS --project knocka-75c63`, then paste the value when prompted | Start a **new rollout**: `firebase apphosting:rollouts:create knocka -b main --project knocka-75c63`. Running revisions keep the old version. Later, disable the old version in Secret Manager. |
| App Check monitor/enforce | `APP_CHECK_ENFORCE` `"false"` / `"true"` in `apphosting.yaml` | Commit and push |
| Mail cap | `WAITLIST_MAIL_DAILY_CAP` (default 300 messages/day) | Commit and push |
| Firestore rules (site DB only) | Edit `firestore.landing.rules` | `firebase deploy --only firestore:knocka-landing --project knocka-75c63` |
| Custom domain | App Hosting > `knocka` > Settings > Domains | **Also add the domain to the reCAPTCHA key's allowed domains**, or every signup gets 403 |

### A5. Deployment log

Add a row for every production rollout. Times are UTC.

| Date (UTC) | Rollout | Commit | What shipped | Result |
| --- | --- | --- | --- | --- |
| 2026-10-01 09:10 | 000 | `1a4a2e5` | First backend rollout (story video section, no env yet) | OK |
| 2026-10-01 10:40 | 001 | `855d8bf` | Firebase setup: `apphosting.yaml`, landing DB, SMTP config | OK, but Gmail 535 (wrong secret) |
| 2026-10-01 11:19 | 002 | `59cc1aa` | Two-step waitlist (optional phone and SMS consent), mail logging | OK |
| 2026-10-01 12:04 | 003 | `81dbfef` | Hardening: trusted-IP rate limit, shared mail cap, no mail for duplicates, country picker | OK |
| 2026-10-01 12:57 | 004 | `e9fda16` | App Check (reCAPTCHA Enterprise), **monitor** mode | OK |
| 2026-10-01 13:03 | 005 | `c6046f0` | App Check **enforced** on the waitlist API | OK |
| 2026-10-01 15:36 | 006 | `297814c` | New hero title, compact phone field | OK |
| 2026-10-01 15:58 | 007 | `2ef6951` | Responsive fixes (invite form, share panel), store badges "Coming soon" | OK |

### A6. Open items

- Add any custom domain to the reCAPTCHA key before switching to it.
- `SMTP_PASS` version 1 (the old, wrong value) is still enabled. Disable it in Secret Manager.
- The "Get the app" header button scrolls to the store badges, which say "Coming soon" until the apps are published.
- Before sending any SMS: add double opt-in. No number is verified today.

---

## Part B — Reusable recipe for a new project

This recipe is for a Next.js app on Firebase App Hosting, with optional Firestore, email and App Check.

### B1. One-time tools

```bash
npm i -g firebase-tools        # this repo used 15.x
firebase login
gcloud auth application-default login   # local Admin SDK access (ADC); no key files
```

### B2. Project and web app

1. Use an existing Firebase project or create one. If the project is **shared with a mobile app**, read B8 first.
2. Firebase console > Project settings > Your apps > add a **Web app**. Copy its config into `NEXT_PUBLIC_FIREBASE_*`. These are public identifiers, not secrets.
3. `.firebaserc`:
   ```json
   { "projects": { "default": "<project-id>" } }
   ```

### B3. App Hosting backend

The easiest way is in the console: App Hosting > Create backend.
- Connect the GitHub repo and pick the live branch (`main`) and a region.
- Root directory `/`, unless it's a monorepo.
- Link the web app from B2.

The CLI alternative is:
```bash
firebase apphosting:backends:create --backend <name> --primary-region us-east4 --app <web-app-id> --root-dir / --project <project-id>
```

The URL will be `https://<backend>--<project-id>.<region>.hosted.app`.

`firebase.json`:
```json
{
  "apphosting": {
    "backendId": "<name>",
    "rootDir": "/",
    "ignore": ["node_modules", ".git", ".next", "firebase-debug.*.log", "functions", ".env*"]
  }
}
```

### B4. `apphosting.yaml`

```yaml
runConfig:
  minInstances: 0      # scale to zero = cheap; first request after idle is slower
  maxInstances: 2
  cpu: 1
  memoryMiB: 512
  concurrency: 80

env:
  # Public, inlined into the browser bundle -> needs BUILD.
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: <project-id>
    availability: [BUILD, RUNTIME]

  # Server-only, plain value.
  - variable: SMTP_HOST
    value: smtp.gmail.com
    availability: [RUNTIME]

  # Secret: only a reference; the value lives in Secret Manager.
  - variable: SMTP_PASS
    secret: SMTP_PASS
    availability: [RUNTIME]
```

Rules that matter:
- **`NEXT_PUBLIC_*` needs `BUILD`.** Next.js inlines these at build time. If you set them only at runtime, they are `undefined` in the browser.
- **Server-only values must not start with `NEXT_PUBLIC_`.** That prefix ships the value to every visitor.
- **Create the secret before you reference it.** A reference to a missing secret fails the build.
- Keep `.env.example` in Git with placeholders, and `.env.local` (git-ignored) for real local values.

### B5. Secrets

```bash
firebase apphosting:secrets:set SMTP_PASS --project <project-id>
# paste the value at the prompt (never as a command argument: it ends up in shell history)
# "grant access to backend?" -> Yes
# "add to apphosting.yaml?"  -> No, and add the reference by hand so you control it

# If access was not granted at creation:
firebase apphosting:secrets:grantaccess SMTP_PASS --backend <name> --project <project-id>
```

- Updating a secret creates a new **version**. Revisions that are already running keep the old version, so you must start a new rollout:
  ```bash
  firebase apphosting:rollouts:create <name> -b main --project <project-id>
  ```
- Never run `apphosting:secrets:access` in a shared terminal or chat; it prints the value.

### B6. Firestore: give the site its own named database

```bash
firebase firestore:databases:create <db-name> --location nam5 --delete-protection ENABLED --project <project-id>
```

`firebase.json` (add the entry next to `apphosting`):
```json
"firestore": [{ "database": "<db-name>", "rules": "firestore.<db-name>.rules" }]
```

```bash
firebase deploy --only firestore:<db-name> --project <project-id>
```

- If only the server writes, use **deny-all** client rules (`allow read, write: if false;`). The Admin SDK bypasses rules.
- On the server, use `getFirestore(app, "<db-name>")`. Read the ID from an env var, and **refuse `(default)` in code**. IAM is project-wide, so the code guard is what keeps the site out of another app's data.
- Credentials are ADC everywhere: the backend's service account on App Hosting, and `gcloud auth application-default login` locally. No JSON keys.

### B7. Email with Gmail SMTP (Nodemailer)

- Turn on 2-Step Verification, then create an **App Password** at https://myaccount.google.com/apppasswords. Store it as the `SMTP_PASS` secret.
- Use `smtp.gmail.com`, port `465` (implicit TLS). `MAIL_FROM` must be the account itself or a verified alias.
- Gmail allows about 500 messages a day. Cap your own sending below that, and keep the count in Firestore so every instance shares it.
- A `535-5.7.8 Username and Password not accepted` error means the secret is wrong. Set a new version, then start a new rollout.
- Plus-aliases (`you+test@gmail.com`) land in **your own** inbox. That is not a wrong-recipient bug.

### B8. App Check (reCAPTCHA Enterprise) for your own API routes

1. Google Cloud console > Security > reCAPTCHA > Create key:
   - Type: Website, score-based.
   - Allowed domains: the `hosted.app` domain plus any custom domain.
   - The **site key is public** (it is a `NEXT_PUBLIC_` value at BUILD). Do not create or use a secret key.
2. Firebase console > App Check > Apps > your web app > reCAPTCHA Enterprise > paste the site key.
3. Client:
   - Use `initializeAppCheck` with `ReCaptchaEnterpriseProvider` and `isTokenAutoRefreshEnabled: true`.
   - Send `getToken()` in an `X-Firebase-AppCheck` header.
   - If there's no token, don't send the request.
4. Server: `getAppCheck(app).verifyToken(token)`. On failure, return a generic 403.
5. **Run monitor mode first**: log the verdict but allow the request (`APP_CHECK_ENFORCE=false`). Once real browsers show valid tokens in the logs, set it to `true`.
6. **Localhost:**
   - The production key doesn't work there, so use the debug provider (`self.FIREBASE_APPCHECK_DEBUG_TOKEN = true`, selected by hostname).
   - Register the token printed in the browser console under App Check > Manage debug tokens.
   - Never commit or ship a debug token, and delete it when you're done.
7. **Shared project with a mobile app:** do **not** turn on App Check enforcement for Firestore, Auth, Storage or the Realtime Database in the console. That would break the apps. Enforce only in your own route code.

### B9. Rate limiting behind App Hosting

- Never trust `X-Forwarded-For`: the sender controls its leftmost value.
- Use `x-fah-client-ip`, and only when `FIREBASE_CONFIG` is set (the platform sets it at runtime).
- **Check after the first deploy** that the platform overwrites a forged header. Send 6 bad requests, each with a different `x-fah-client-ip`. If the limit is 5, the 6th must return `429`. If it returns `400`, the header can be forged.
- In-memory counters are per instance, so treat them as a first line only. Anything that costs money (email) gets a shared Firestore counter.

### B10. Logs and debugging

- Open Cloud console > Logging > Logs Explorer, and filter:
  ```
  resource.type="cloud_run_revision"
  resource.labels.service_name="<backend>"
  ```
  Build logs are under App Hosting > Rollouts > the build.
- Logs can take a minute to show up. If a line seems missing, query again before you conclude anything.
- Log one sanitized line per important step (`[waitlist] Mail stage=send to=owner accepted`), and never log secrets.

| Symptom | Usual cause |
| --- | --- |
| Build fails right after adding a secret reference | Secret doesn't exist, or the backend wasn't granted access (`secrets:grantaccess`) |
| `NEXT_PUBLIC_*` is `undefined` in the browser | Missing `BUILD` in `availability` |
| New secret value is ignored | No rollout since the secret changed |
| API returns 403 everywhere after a domain change | Domain not on the reCAPTCHA key's allowed list |
| API returns 503 in production | A required runtime env var or secret is missing (the code fails closed) |
| `PERMISSION_DENIED` from Firestore locally | Run `gcloud auth application-default login` |
| Layout fine locally, broken live | Real data is longer (URLs, names). Test with production-like values |

### B11. Safety rules

- Never run a bare `firebase deploy`. Always use `--only <target>`.
- In a shared project, never touch the other app's `(default)` database, its rules, Auth, Storage, Functions or FCM.
- No service-account JSON, private keys, passwords or debug tokens in Git, docs, logs or chat.
- Don't delete or overwrite production data you didn't create. When testing, delete only your own test records.
- Turn security features on in stages: monitor, then enforce.
- After every deploy, test the live URL itself, not just localhost.
