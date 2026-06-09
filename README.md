# SiteLog

Real-time team time tracking app with in-scope/out-of-scope work logging for invoicing.

## Features

- **Supervisor Dashboard**: Log tasks for team, verify entries, download reports
- **Employee Dashboard**: See assigned tasks and log your own time
- **Real-time Sync**: All devices stay in sync via Firebase
- **Scope Tracking**: Categorize work as in-scope or out-of-scope
- **Weekly Reports**: Export CSV for invoicing and boss reports

## Setup

### 1. Firebase Configuration

1. Go to [firebase.google.com](https://firebase.google.com)
2. Create a new project called "SiteLog"
3. Add a web app
4. Copy your Firebase config from Project Settings
5. When you first open the deployed app, paste the Firebase config JSON
6. The app will save it to your browser's local storage

### 2. Local Development (Optional)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### 3. Deploy to Vercel

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial SiteLog setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sitelog.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repo
5. Click "Deploy"
6. Your app will be live at `sitelog.vercel.app` (or custom domain)

## Usage

1. **First Time**: 
   - Add Firebase config (from Firebase Console)
   - Set supervisor name and password
   - Add team member names

2. **Supervisor**:
   - Login with password
   - Log tasks as you see them happen
   - Verify employee entries
   - Download weekly CSV report

3. **Employee**:
   - Select your name to login
   - See tasks assigned to you
   - Log your own hours
   - No password needed

## Data Storage

- All data stored in Firebase Realtime Database
- Each project has its own data space
- Data persists across sessions and devices
- Accessible via the same URL from any device

## Support

- Check Firebase Rules if employees can't log time
- Use Supervisor dashboard to verify all entries
- Download weekly reports for boss/invoicing
