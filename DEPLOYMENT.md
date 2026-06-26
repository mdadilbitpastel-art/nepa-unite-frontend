# Deploying the NEPA Unite frontend (Vercel)

The app reads every backend URL from environment variables and falls back to
`http://localhost:8000` when they're unset — so the **same code runs locally and
in production**. You only change environment variables, never code.

- **Backend (already deployed, Render):** https://nepa-unite-mtii.onrender.com
- **Frontend (this repo) → Vercel**

---

## 1. Environment variables

### Local development (`.env.local`, git-ignored)

Already configured to talk to a backend on `localhost:8000`. Nothing to do
unless you want local to hit the Render backend instead.

### Production (set these in Vercel → Project → Settings → Environment Variables)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://nepa-unite-mtii.onrender.com/api/v1` |
| `NEXT_PUBLIC_API_ROOT_URL` | `https://nepa-unite-mtii.onrender.com/api` |
| `NEXT_PUBLIC_SIGNUP_URL` | `https://nepa-unite-mtii.onrender.com/signup/` |
| `NEXT_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` |
| `NEXTAUTH_URL` | `https://<your-app>.vercel.app` |
| `NEXTAUTH_SECRET` | a long random string (see below) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | your Stripe publishable key (optional) |

Generate a secret:

```bash
openssl rand -base64 32
```

> After Vercel gives you the real domain, update `NEXT_PUBLIC_APP_URL` and
> `NEXTAUTH_URL` to that exact URL and redeploy. `NEXT_PUBLIC_*` values are baked
> in at build time, so a change to them needs a new deployment.

---

## 2. Deploy to Vercel

1. Push this folder to its own GitHub repo (see below).
2. On vercel.com → **Add New → Project** → import the repo.
3. Framework preset: **Next.js** (auto-detected). Root directory: `./`.
4. Add the production env vars from the table above.
5. **Deploy.**

Build command `next build` and output are auto-detected — no `vercel.json` needed.

---

## 3. Backend must allow the Vercel origin (one-time, in the Django backend)

The browser calls the Render API directly, so Django has to permit the Vercel
domain. In the **backend** project (`github.com/mdadilbitpastel-art/nepa-unite`)
make sure these include your Vercel URL, then redeploy on Render:

```python
ALLOWED_HOSTS = [".onrender.com", ".vercel.app"]            # already has render
CORS_ALLOWED_ORIGINS = ["https://<your-app>.vercel.app"]
CSRF_TRUSTED_ORIGINS = ["https://<your-app>.vercel.app", "https://nepa-unite-mtii.onrender.com"]
```

(Render free tier sleeps when idle — the first request after a while can take
~30–50s to wake the backend.)
