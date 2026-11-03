# Temporary Coming Soon page

While it is live, `/` renders a lightweight Coming Soon page instead of the
landing page. The landing page is not deleted or changed: it lives, as it was,
in `src/components/landing/LandingPage.tsx`, and is simply not imported.

## What is where

| File | Role |
| --- | --- |
| `src/app/page.tsx` | The switch. Renders `<ComingSoon />` and its metadata today. |
| `src/components/landing/LandingPage.tsx` | The original landing page, section for section, plus AOS and the background music (moved here from `layout.tsx`, same DOM position). |
| `src/components/coming-soon/` | The Coming Soon page, its knock button and its metadata. |
| `src/styles/coming-soon.css` | Its styles; every class is `cs-` prefixed. Imported last in `globals.css`. |
| `next.config.ts` | Short HTML cache for `/` (see Caching). Kept after the restore. |

The Coming Soon page has **no waitlist form**. The waitlist API
(`/api/waitlist*`) is unchanged and still deployed, and the landing page's
own forms use it again as soon as the landing page is restored.

## Restoring the landing page

1. Replace the whole of `src/app/page.tsx` with:

   ```tsx
   import { LandingPage } from "@/components/landing/LandingPage";

   export default function Home() {
     return <LandingPage />;
   }
   ```

   The layout's metadata (title, description, Open Graph) then applies to `/`
   again automatically.

2. `npm run build`, commit, push to `main` (see Deploying).

That is the whole restore. Optional cleanup, any time after: delete
`src/components/coming-soon/`, `src/styles/coming-soon.css` and its import
line at the bottom of `src/app/globals.css`.

Do not import `LandingPage` and `ComingSoon` side by side behind a flag: an
unrendered import still puts the landing page's client code (AOS,
framer-motion, the music player) into the route's JavaScript.

## Caching

- Next marks a prerendered page's HTML `Cache-Control: s-maxage=31536000`.
  App Hosting's Cloud CDN honours `s-maxage`, and whether a rollout purges it
  is not documented — which is how an old page can stay visible.
- `next.config.ts` now sends `public, max-age=0, s-maxage=300` for `/`
  (including `/?ref=…` and its RSC requests). The CDN keeps the HTML at most
  5 minutes; browsers revalidate every time. Verified with `next start`.
- `/_next/static/*` keeps `public, max-age=31536000, immutable` (hashed file
  names). `/music.mp3` keeps its year-long cache.
- So after any rollout — this one or the restore — `/` is fresh everywhere
  within about 5 minutes, with no manual purge.

## Deploying (needs approval first)

App Hosting backend `knocka` rolls out automatically from `main`.

1. Commit and push to `main`, or start a rollout by hand:
   `firebase apphosting:rollouts:create knocka -b main --project knocka-75c63`.
2. Wait for the rollout to finish (Firebase console > App Hosting > knocka).

### Before re-enabling the public domains

- **reCAPTCHA key.** Not needed for the Coming Soon page, which has no form.
  Needed before the landing page is restored on a custom domain: App Check
  is enforced on `/api/waitlist*`, and the key `knocka landingpage` must list
  every domain the forms are used from (`weknocka.com`, `www.weknocka.com`),
  or every signup there gets a 403. See the playbook, A4.
- **SITE_URL.** `apphosting.yaml` sets `SITE_URL` to the `hosted.app`
  address, so the canonical URL, `og:url`, `og:image`, `robots.txt`, the
  sitemap and the invite link in confirmation emails all point there. For
  `https://weknocka.com/` to be canonical, change that one value to
  `https://weknocka.com` (it is read at BUILD and RUNTIME).
- Then re-enable `weknocka.com` / `www.weknocka.com` in
  App Hosting > knocka > Settings > Domains.

### Verifying

```bash
curl -sI https://weknocka.com/ | grep -i cache-control
# expect: public, max-age=0, s-maxage=300
curl -s https://weknocka.com/ | grep -o '<title>[^<]*</title>'
# expect: Knocka — Coming Soon | Feel the Message
```

Then, in a private window: the page loads, and no `.mp4`/`.mp3` request
appears in the Network panel.
