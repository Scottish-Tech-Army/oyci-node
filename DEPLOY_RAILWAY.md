# Deploying to Railway

A step-by-step guide to making the app available online using [Railway](https://railway.com) — a simple, low-cost hosting platform.

---

## Step 1 — Create Your Accounts

1. Go to [https://railway.com](https://railway.com) and sign up using your **GitHub** account
2. Make sure the project code is in a **GitHub repository** (public or private — both work)

Railway's free trial gives you enough credit to test everything. After that, expect roughly **£5/month** for a small charity app like this.

---

## Step 2 — Deploy the Backend

1. From the Railway dashboard, click **New Project → Deploy from GitHub Repo**
2. Select your repository
3. Railway will detect the app — set the following:

### Settings

| Setting          | Value                |
| ---------------- | -------------------- |
| Root Directory   | `backend`            |
| Build Command    | `npm run build`      |
| Start Command    | `npm run migrate && npm start` |

### Environment Variables

Click **Variables** and add:

| Variable       | Value                             |
| -------------- | --------------------------------- |
| `JWT_SECRET`   | A long random string (see below)  |
| `NODE_ENV`     | `production`                      |
| `CORS_ORIGINS` | Your frontend URL (added in Step 3) |

> **Generating a secret:** Ask ChatGPT to "generate a 64-character random string", or use a password manager to create one. Keep it private.

### Storage

1. Go to the backend service settings and click **Add Volume**
2. Set the mount path to `/app/data`
3. Add one more environment variable:

| Variable  | Value             |
| --------- | ----------------- |
| `DB_FILE` | `/app/data/oyci.db` |

This ensures your database is saved permanently and survives redeployments.

---

## Step 3 — Deploy the Frontend

1. From the Railway dashboard, click **New → Service → GitHub Repo** (same repository)
2. Configure:

| Setting        | Value                                  |
| -------------- | -------------------------------------- |
| Root Directory | `frontend`                             |
| Build Command  | `npm run build`                        |
| Start Command  | `npx serve dist --single --listen 3000` |

3. Add one environment variable:

| Variable       | Value                                |
| -------------- | ------------------------------------ |
| `VITE_API_URL` | The backend URL from Step 2 (e.g. `https://your-backend.up.railway.app`) |

4. Once deployed, copy the frontend's public URL and go back to your **backend** service
5. Update the `CORS_ORIGINS` variable to match the frontend URL (e.g. `https://your-frontend.up.railway.app`)

---

## Step 4 — Set Up and Log In

### Seed the database (first time only)

1. In the Railway dashboard, go to your **backend** service
2. Open the **Settings** tab and find the **Railway CLI** or use the built-in terminal
3. Run:

```
npm run seed
```

This creates the initial admin account and sample data.

### Log in

Open your frontend URL in a browser and log in with:

| Field    | Value               |
| -------- | ------------------- |
| Email    | admin@oyci.internal |
| Password | Dev@dmin123!        |

> **Important:** Change the admin password immediately after first login. Go to **My Account** in the app to update it.

---

## What You Get

| Feature              | Detail                                      |
| -------------------- | ------------------------------------------- |
| **Automatic HTTPS**  | Railway provides free secure connections     |
| **Auto-deploy**      | Push code to GitHub and it updates instantly |
| **Persistent data**  | Your database is stored on a permanent volume |
| **Custom domain**    | Connect your own domain in Railway settings  |

---

## Costs

Railway charges based on usage. For a small charity app with a handful of users:

| Component | Estimated Cost   |
| --------- | ---------------- |
| Backend   | ~£2–3/month      |
| Frontend  | ~£1–2/month      |
| Storage   | ~£0.25/GB/month  |
| **Total** | **~£4–5/month**  |

---

*Need help? Railway has excellent documentation at [docs.railway.com](https://docs.railway.com) and an active community Discord.*
