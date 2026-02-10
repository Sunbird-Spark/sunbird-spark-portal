#!/usr/bin/env node

import { copyFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public');

// Player configurations
const players = [
  {
    name: 'EPUB Player',
    source: 'node_modules/@project-sunbird/sunbird-epub-player-web-component',
    files: [
      { from: 'sunbird-epub-player.js', to: 'assets/epub-player/sunbird-epub-player.js' },
      { from: 'styles.css', to: 'assets/epub-player/styles.css' },
    ],
    directories: [
      { from: 'assets', to: 'assets/epub-player/assets' },
    ],
  },
  // PDF and Video players will be added when packages are installed
  // {
  //   name: 'PDF Player',
  //   source: 'node_modules/@project-sunbird/sunbird-pdf-player-web-component',
  //   files: [
  //     { from: 'sunbird-pdf-player.js', to: 'assets/pdf-player/sunbird-pdf-player.js' },
  //     { from: 'styles.css', to: 'assets/pdf-player/styles.css' },
  //   ],
  //   directories: [
  //     { from: 'assets', to: 'assets/pdf-player/assets' },
  //   ],
  // },
  // {
  //   name: 'Video Player',
  //   source: 'node_modules/@project-sunbird/sunbird-video-player-web-component',
  //   files: [
  //     { from: 'sunbird-video-player.js', to: 'assets/video-player/sunbird-video-player.js' },
  //     { from: 'styles.css', to: 'assets/video-player/styles.css' },
  //   ],
  //   directories: [
  //     { from: 'assets', to: 'assets/video-player/assets' },
  //   ],
  // },
];

// Helper function to recursively copy directories
// Throws on any error to ensure failures are caught by caller
function copyDirectory(source, destination) {
  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true });
  }

  const entries = readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(source, entry.name);
    const destPath = join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      copyFileSync(sourcePath, destPath);
    }
  }
}

// Ensure public directory exists
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// Clean up existing player files and assets folder
console.log('🧹 Cleaning existing player files...\n');

// Remove old player files from public root
const oldFiles = [
  'sunbird-epub-player.js',
  'epub-player-styles.css',
  'sunbird-pdf-player.js',
  'sunbird-video-player.js',
  'styles.css'
];

oldFiles.forEach(file => {
  const filePath = join(publicDir, file);
  if (existsSync(filePath)) {
    rmSync(filePath, { force: true });
    console.log(`  ✓ Removed old ${file}`);
  }
});

// Clean up existing assets folder to start fresh
const assetsDir = join(publicDir, 'assets');
if (existsSync(assetsDir)) {
  rmSync(assetsDir, { recursive: true, force: true });
  console.log('  ✓ Removed old assets folder');
}

console.log('\n📦 Copying player files to public directory...\n');

let hasErrors = false;

players.forEach((player) => {
  console.log(`🎯 ${player.name}:`);
  const sourceBase = join(__dirname, '..', player.source);

  // Copy files
  if (player.files) {
    player.files.forEach((file) => {
      const sourcePath = join(sourceBase, file.from);
      const destPath = join(publicDir, file.to);

      try {
        // Ensure destination directory exists
        const destDir = dirname(destPath);
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true });
        }

        copyFileSync(sourcePath, destPath);
        console.log(`  ✓ Copied ${file.from} → public/${file.to}`);
      } catch (error) {
        console.error(`  ✗ Failed to copy ${file.from}:`, error.message);
        hasErrors = true;
      }
    });
  }

  // Copy directories
  if (player.directories) {
    player.directories.forEach((dir) => {
      const sourcePath = join(sourceBase, dir.from);
      const destPath = join(publicDir, dir.to);

      try {
        copyDirectory(sourcePath, destPath);
        console.log(`  ✓ Copied ${dir.from}/ → public/${dir.to}/`);
      } catch (error) {
        console.error(`  ✗ Failed to copy ${dir.from}/:`, error.message);
        hasErrors = true;
      }
    });
  }

  console.log('');
});

if (hasErrors) {
  console.error('❌ Player files copy failed! Some assets are missing.\n');
  process.exit(1);
}

console.log('✅ Player files copied successfully!\n');
