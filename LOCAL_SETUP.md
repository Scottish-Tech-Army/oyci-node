# Running the App on Your Computer

A simple guide to get the OYCI platform running locally. No prior experience needed — just follow each step.

---

## Step 1 — Install the Tools You Need

Before anything else, you need **Node.js** installed on your computer. This is a free tool that powers the app.

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** version (the one labelled "Recommended for Most Users")
3. Run the installer and accept all the defaults
4. To check it worked, open a terminal and type:

```
node --version
```

You should see a version number like `v20.x.x`. If you do, you're ready.

> **What's a terminal?** On Mac, search for "Terminal" in Spotlight. On Windows, search for "Command Prompt" or "PowerShell".

---

## Step 2 — Download the Code and Install Dependencies

1. Download or clone the project folder onto your computer
2. Open a terminal and navigate to the project folder:

```
cd path/to/techForGood
```

3. Install all the app's dependencies by running these three commands one at a time:

```
npm install
npm --prefix backend install
npm --prefix frontend install
```

This downloads everything the app needs to run. It may take a minute or two.

---

## Step 3 — Set Up the Database

The app uses a small local database that lives as a file on your computer — no separate database software to install.

From the project folder, run:

```
cd backend
npm run migrate
npm run seed
```

- **migrate** creates the database structure
- **seed** fills it with sample data so you can explore the app straight away

Once done, navigate back to the project root:

```
cd ..
```

---

## Step 4 — Start the App

You need **two terminal windows** — one for the backend (the engine) and one for the frontend (what you see in the browser).

### Terminal 1 — Start the backend

```
cd backend
npm run dev
```

You should see a message confirming the server is running on **port 3001**.

### Terminal 2 — Start the frontend

Open a new terminal window, navigate to the project folder, and run:

```
npm run dev
```

You should see a message with a local URL.

### Open in your browser

Go to **[http://localhost:5173](http://localhost:5173)** and log in with:

| Field    | Value               |
| -------- | ------------------- |
| Email    | admin@oyci.internal |
| Password | Dev@dmin123!        |

---

## Troubleshooting

| Problem                          | Solution                                                                 |
| -------------------------------- | ------------------------------------------------------------------------ |
| `node: command not found`        | Node.js isn't installed — revisit Step 1                                 |
| `npm install` shows errors       | Delete the `node_modules` folder and the `package-lock.json`, then retry |
| Port already in use              | Another app is using that port — close it or restart your computer       |
| Login doesn't work               | Make sure you ran `npm run seed` in Step 3                               |
| Frontend loads but nothing shows | Make sure the backend is running in the other terminal                   |

---

*Both terminals need to stay open while you use the app. To stop, press `Ctrl + C` in each terminal.*
