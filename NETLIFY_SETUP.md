# Netlify Functions Setup Guide

Your JCUK Site is now configured to run on Netlify with serverless functions! 🚀

## How It Works

Instead of running a Python server, the site now uses **Netlify Functions** (AWS Lambda under the hood) to serve your API endpoints:

- **`/.netlify/functions/content`** - Returns your videos from `data/content.json`
- **`/.netlify/functions/settings`** - Returns public settings from `data/settings.json`
- **`/.netlify/functions/youtube-channel`** - Fetches your YouTube channel profile & subscriber count

## Workflow: Local → Netlify

### 1. **Edit Locally** (Your Machine)
```bash
cd /path/to/jcuk-site_prototype-main
python3 server.py
# Open http://localhost:3000/admin to edit videos
```

### 2. **Make Changes**
- Add/edit/delete videos in the admin
- Modify `data/content.json` directly if needed
- Changes save automatically to local files

### 3. **Push to GitHub**
```bash
git add .
git commit -m "Update videos"
git push origin main
```

### 4. **Netlify Auto-Deploys**
- Netlify automatically rebuilds when you push
- Functions read your updated `data/content.json`
- Public site shows new videos instantly ✅

## Important Notes

✅ **What Works:**
- Public site displays videos from your data files
- YouTube profile image & subscriber count load
- Search, filtering, responsive design all work
- Admin panel works locally

❌ **What Doesn't:**
- Editing videos directly on Netlify won't work (admin needs local server)
- API keys are safe in `data/settings.json` (not exposed to public)

## If Something Goes Wrong

**Videos not showing on public site?**
1. Check `data/content.json` is valid JSON (use VS Code validator)
2. Verify files are committed and pushed to GitHub
3. Check Netlify deploy logs for errors

**YouTube profile image not loading?**
1. Verify `youtubeApiKey` and `youtubeChannelId` in `data/settings.json`
2. Test locally first: `http://localhost:3000` should work
3. Check the key is valid in [Google Cloud Console](https://console.cloud.google.com/)

## Need to switch back to Python server?

If you want to move the Python server to production later, you can:
1. Use **Render** or **Railway** (easy Python hosting)
2. Or convert this to full Node.js backend
3. Your data files will migrate without any changes

For now, this setup keeps things simple: edit locally, deploy static files + lightweight functions to Netlify. 🎉
