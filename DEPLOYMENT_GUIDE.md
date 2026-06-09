# SiteLog Deployment Guide

Complete step-by-step guide to deploy SiteLog to Vercel with Firebase.

## Prerequisites

- GitHub account (free)
- Vercel account (free)
- Firebase account (free)
- Git installed on your computer

---

## Phase 1: Firebase Setup (5 minutes)

### Step 1.1: Create Firebase Project

1. Go to **[firebase.google.com](https://firebase.google.com)**
2. Click **"Get Started"** → **"Create a project"**
3. Project name: `SiteLog`
4. Uncheck "Enable Google Analytics" (not needed)
5. Click **"Create project"** (wait 1-2 min)

### Step 1.2: Create Web App

1. Once project loads, click the **`</>`** (web) icon to add a web app
2. App name: `SiteLog Web`
3. Check "Also set up Firebase Hosting for this app" (optional but helpful)
4. Click **"Register app"**
5. You'll see a config that looks like:

```json
{
  "apiKey": "AIzaSyDx...",
  "authDomain": "sitelog-abc123.firebaseapp.com",
  "projectId": "sitelog-abc123",
  "storageBucket": "sitelog-abc123.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc123..."
}
```

6. **Copy this entire JSON** — you'll need it later

### Step 1.3: Enable Realtime Database

1. In Firebase Console, go to **Realtime Database** (left sidebar)
2. Click **"Create Database"**
3. Location: Choose closest to you (or default)
4. Rules: Start in **"Test mode"** (for now)
5. Click **"Enable"**

**Done with Firebase! ✓**

---

## Phase 2: GitHub Setup (5 minutes)

### Step 2.1: Create Repository

1. Go to **[github.com](https://github.com)**
2. Click **"+"** → **"New repository"**
3. Repository name: `sitelog`
4. Description: `Real-time team time tracking`
5. Make it **Public**
6. Click **"Create repository"**

### Step 2.2: Prepare Your Code

The files you need:
```
sitelog/
├── SiteLog.jsx
├── App.jsx
├── main.jsx
├── index.html
├── index.css
├── package.json
├── vite.config.js
├── postcss.config.js
├── tailwind.config.js
├── .gitignore
├── README.md
└── DEPLOYMENT_GUIDE.md
```

All these files are ready in your `/mnt/user-data/outputs/` folder.

### Step 2.3: Push Code to GitHub

Open your terminal and run:

```bash
# Navigate to where your files are
cd /path/to/your/sitelog/files

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial SiteLog setup"

# Rename branch to main
git branch -M main

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/sitelog.git

# Push to GitHub
git push -u origin main
```

**Done with GitHub! ✓**

---

## Phase 3: Vercel Deployment (5 minutes)

### Step 3.1: Connect to Vercel

1. Go to **[vercel.com](https://vercel.com)**
2. Sign up with GitHub (easiest)
3. Click **"New Project"**
4. Find and click your `sitelog` repository
5. Click **"Import"**

### Step 3.2: Configure & Deploy

1. **Project name**: `sitelog` (auto-filled)
2. **Framework**: Should auto-detect as "Vite"
3. Leave everything else as default
4. Click **"Deploy"**

**Wait 2-3 minutes...**

✅ **Your app is now live!** You'll see a URL like:
```
https://sitelog.vercel.app
```

**Done! ✓**

---

## Phase 4: First-Time App Setup (2 minutes)

### Step 4.1: Initial Configuration

1. Open your Vercel URL: `https://sitelog.vercel.app`
2. You'll see "Firebase Config (JSON)" input
3. Paste the Firebase config you copied earlier (from Step 1.2)
4. Click outside the box to save
5. The page will reload

### Step 4.2: Setup Your Team

1. **Your Name (Supervisor)**: Enter supervisor name (e.g., "John")
2. **Supervisor Password**: Set a password (e.g., "SiteLog123")
3. **Team Members**: Add each employee's first name
   - Click "Add" for each one
4. Click **"Start SiteLog"**

✅ **All set!**

---

## Using SiteLog

### For Supervisor

1. Go to app URL
2. Click **"Login as Supervisor"**
3. Enter password
4. **Log tasks** as work happens:
   - Task name
   - Who did it
   - Time (10-120 min increments)
   - Date
   - In-Scope or Out-of-Scope
5. Click circle to **verify** entries
6. **Download Weekly Report** for invoicing

### For Employee

1. Open same app URL
2. Click **"Login as Employee"**
3. Select your name
4. **See tasks** assigned to you
5. **Log your own time** for additional work
6. All updates appear **instantly** on supervisor's view

---

## Troubleshooting

### Firebase Config Not Working
- Check JSON syntax (use [jsonlint.com](https://jsonlint.com))
- Make sure you copied the ENTIRE config from Firebase Console
- Press F12, check browser console for errors

### Data Not Syncing
- Check Firebase Realtime Database is created
- Check Firebase Rules (should be in Test mode by default)
- Make sure both using same URL (https://sitelog.vercel.app)

### Employees Can't See Tasks
- Make sure supervisor added them to Team Members
- Check they're selecting the correct name

### Need to Update Code?

1. Make changes to files
2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
3. Vercel auto-deploys (takes 1-2 min)

---

## Firebase Security (Important!)

When you're ready for production, update Firebase Rules:

1. In Firebase Console, go to **Realtime Database → Rules**
2. Replace with:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

(This allows anyone with the URL to access. For more security, set up authentication.)

---

## Questions?

- **Firebase Help**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Vercel Help**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub Help**: [docs.github.com](https://docs.github.com)

---

## Next Steps

After deployment:

1. ✅ Supervisor sets up Firebase config
2. ✅ Supervisor logs tasks during the week
3. ✅ Employees log their own time
4. ✅ Friday: Supervisor downloads CSV report
5. ✅ Use report for invoicing/boss update

**You're live! 🚀**
