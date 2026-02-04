# Automated PDF Player Assets Setup

## Overview

The PDF player assets are now **automatically copied** from `node_modules` to `public/assets` using lifecycle hooks. You no longer need to manually copy files!

## How It Works

### Automatic Triggers

The assets are copied automatically in these scenarios:

1. **After `npm install`** (postinstall hook)
   ```bash
   npm install
   # → Automatically runs: npm run setup-assets
   ```

2. **Before `npm run dev`** (predev hook)
   ```bash
   npm run dev
   # → Automatically runs: npm run setup-assets
   # → Then starts Vite dev server
   ```

3. **Before `npm run build`** (prebuild hook)
   ```bash
   npm run build
   # → Automatically runs: npm run setup-assets
   # → Then runs TypeScript + Vite build
   ```

### Manual Trigger

You can also manually copy assets anytime:

```bash
npm run setup-assets
```

## What Gets Copied

**Source:** `node_modules/@project-sunbird/sunbird-pdf-player-web-component/assets/`

**Destination:** `public/assets/`

**Contents:**
- `pdfjs/` - PDF.js library and viewer
  - `web/viewer.html` - PDF viewer UI
  - `web/viewer.css` - Viewer styles
  - `web/viewer.js` - Viewer logic
  - `build/pdf.js` - PDF parsing engine
  - `build/pdf.worker.js` - PDF rendering worker
- `*.svg` - UI icons (arrows, rotate, timer, etc.)

## Script Details

**Location:** `scripts/setup-pdf-assets.js`

**Features:**
- ✅ Checks if source exists
- ✅ Creates target directory if needed
- ✅ Recursively copies all files
- ✅ Preserves directory structure
- ✅ Shows progress messages
- ✅ Error handling

**Output Example:**
```
📦 Setting up PDF Player assets...
📋 Copying assets from node_modules...
✅ PDF Player assets copied successfully!
   From: /path/to/node_modules/@project-sunbird/.../assets
   To:   /path/to/public/assets
```

## Package.json Scripts

```json
{
  "scripts": {
    "setup-assets": "node scripts/setup-pdf-assets.js",
    "predev": "npm run setup-assets",
    "prebuild": "npm run setup-assets",
    "postinstall": "npm run setup-assets"
  }
}
```

## Workflow Examples

### New Team Member Setup

```bash
# Clone repo
git clone <repo-url>
cd sunbird-portal/frontend

# Install dependencies
npm install
# ✅ Assets automatically copied via postinstall hook

# Start development
npm run dev
# ✅ Assets verified via predev hook
```

### After Deleting Assets Folder

```bash
# Oops, deleted public/assets by mistake
rm -rf public/assets

# Just run dev - it will restore assets automatically
npm run dev
# ✅ Assets automatically restored via predev hook
```

### Production Build

```bash
npm run build
# ✅ Assets automatically copied via prebuild hook
# ✅ Build completes with assets in place
```

### CI/CD Pipeline

```yaml
# In your CI/CD config (e.g., .github/workflows/build.yml)
- name: Install dependencies
  run: npm install
  # ✅ Assets copied automatically

- name: Build
  run: npm run build
  # ✅ Assets verified before build
```

## Troubleshooting

### Assets Not Found During Build

**Symptom:** Build fails with "Failed to load resource: /assets/pdfjs/web/viewer.html"

**Solution:**
```bash
npm run setup-assets
```

### Need to Update Assets

**Scenario:** Sunbird package updated with new assets

**Solution:**
```bash
npm install @project-sunbird/sunbird-pdf-player-web-component@latest
# ✅ postinstall hook copies new assets automatically
```

### Verify Assets Exist

```bash
ls -la public/assets/pdfjs/web/viewer.html
# Should show: -rw-r--r--@ 1 user staff 24K ...
```

## Benefits

✅ **Zero Manual Work** - No more manual copying  
✅ **Always Up-to-Date** - Runs on every install  
✅ **CI/CD Ready** - Works in automated pipelines  
✅ **Developer Friendly** - New devs don't need special setup instructions  
✅ **Build Safe** - Assets guaranteed present before build  
✅ **Git Clean** - `public/assets` can be gitignored (assets regenerated from node_modules)

## .gitignore Recommendation

Since assets are now auto-generated, you can ignore them in git:

```gitignore
# Auto-generated PDF player assets
public/assets/
```

**Why?** Assets are always available from `node_modules` and auto-copied, so no need to track them in git.

## Maintenance

The setup script is simple and requires no maintenance. If the source path changes in a future version of the Sunbird package, simply update:

```javascript
// In scripts/setup-pdf-assets.js
const source = join(
  projectRoot,
  'node_modules/@project-sunbird/sunbird-pdf-player-web-component/assets'  // ← Update this if path changes
);
```

## Summary

**Before:**
```bash
# Manual steps every time
mkdir -p public/assets
cp -r node_modules/@project-sunbird/.../assets/* public/assets/
```

**After:**
```bash
# Just this - assets auto-copied!
npm run dev
```

🎉 **That's it! The assets setup is now fully automated.**
