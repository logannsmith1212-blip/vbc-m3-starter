# Module 3 Playbook Submission — Service Request Portal

**Name:** [TODO: your name]
**Live URL:** https://stately-tanuki-9d1478.netlify.app
**Repo:** https://github.com/logannsmith1212-blip/vbc-m3-starter

## What I built

*3–5 plain-English sentences about what you built and who it's for. No jargon — write it the way you'd explain it to a coworker who doesn't code.*

[TODO: 3–5 plain-English sentences about what you built and who it's for]

## Debug Log

*Document the bug you hit when your deployed site stopped behaving like your laptop. Fill in all five fields below. Keep it factual — what you saw, what you asked, what turned out to be true.*

*Issue #1: New requests failed to save on the live site. Found Nov 11, 2026, during the first test after deploying to Netlify (valid entry). Status: Fixed.*

**Symptom:** I submitted a valid request (Live Test, Chicago, "Testing live save", Low) on the live Netlify site. I expected a 201, with the request appearing in the table and staying after a refresh, as it did locally. Instead the page showed "Could not save the request. Please try again." The browser console showed POST /api/requests 500, and the Netlify function log showed "Error: EROFS: read-only file system, open '/var/task/data/seed-requests.csv'". Reading still worked: the tiles showed 9 / 2 / 5 and the table loaded.

**What I asked Claude:**

> I deployed to Netlify. On the live site, the tiles and table load (9 / 2 / 5), but submitting a valid entry fails.
>
> What I did: Submitted "Live Test", Chicago, "Testing live save", Low on the live site.
> What I expected: 201, and the entry appears and stays after refresh — like it does locally.
> What happened: Page shows "Could not save the request. Please try again." Console shows POST /api/requests 500.
> Netlify function log:
> POST /api/requests failed: Error: EROFS: read-only file system, open '/var/task/data/seed-requests.csv'
>
> Please do NOT change any code yet. Explain in plain language:
> 1. Why saving works locally but fails on Netlify, even though reading works
> 2. Why, even if the write succeeded, the data wouldn't survive on Netlify
> 3. What the fix needs to be

**Root cause:** The app saved new requests by appending to data/seed-requests.csv. That works locally, but Netlify runs API routes as serverless functions whose files are a read-only bundle, so the write was blocked (EROFS) and the route returned 500. Even if writes were allowed, function storage is temporary and resets between invocations and deploys, so the data would not have persisted.

**Fix:** I moved storage to a hosted Supabase Postgres database. I created a "requests" table matching the CSV columns, with database checks matching our validation, imported the 22 seed rows (ids 1–22), and enabled Row Level Security with no public policies. I had Claude rewrite lib/requests.js to read, insert and update through @supabase/supabase-js using SUPABASE_URL and SUPABASE_SECRET_KEY, on the server only. The keys are in .env.local (gitignored) locally, and in Netlify environment variables (secret key marked secret) for the live site. The route files, validation and API contract were unchanged.

**Verification:** I redeployed, submitted the same Live Test entry on the live site, and refreshed. It [TODO: finish this sentence. What happened after the refresh, and any other checks you ran (for example a second browser, a status change, a redeploy)?]

## Test pass results

*Run all five checks against your live site and record what happened. "Result" is pass or fail plus what you actually saw. "Fix made" is what you changed, or "None needed."*

| # | Check | What I did | Result | Fix made |
|---|---|---|---|---|
| 1 | Valid entry | [TODO] | [TODO] | [TODO] |
| 2 | Empty form | [TODO] | [TODO] | [TODO] |
| 3 | Duplicate-ish | [TODO] | [TODO] | [TODO] |
| 4 | Absurd values | [TODO] | [TODO] | [TODO] |
| 5 | Hand-checked tile math | [TODO] | [TODO] | [TODO] |

## Known limitations

*Be honest. List 3–5 things your app can't do or doesn't protect against, one bullet each — the things you'd want a real user to know before trusting it.*

- [TODO: limitation]
- [TODO: limitation]
- [TODO: limitation]

## Assessment

*Around 250 words, first person. Where did AI move fast for you? Describe one genuine almost-right moment — something that looked correct and wasn't — and how you caught it. What would you prompt differently next time?*

[TODO: ~250 words, first person]
