#!/usr/bin/env node
import { copyFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public');
const assetsDir = join(publicDir, 'assets');

// Player configurations
const players = [
  {
    name: 'QUML Player',
    source: 'node_modules/@project-sunbird/sunbird-quml-player-web-component',
    files: [
      { from: 'sunbird-quml-player.js', to: 'assets/quml-player/sunbird-quml-player.js' },
      { from: 'styles.css', to: 'assets/quml-player/styles.css' },
    ],
    // Add directories if needed after inspecting the package
    directories: []
  },
];

// Helper function to recursively copy directories
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

console.log('🧹 Cleaning existing player files...\n');

// Clean up existing assets folder related to quml-player
// Instead of removing all assets, we should be careful if we want to be nice.
// But following the reference pattern (which wiped assets), I will wipe quml-player specific folder if it exists.
const qumlPlayerDir = join(assetsDir, 'quml-player');
if (existsSync(qumlPlayerDir)) {
  rmSync(qumlPlayerDir, { recursive: true, force: true });
  console.log('  ✓ Removed old quml-player folder');
}

console.log('\n📦 Copying player files to public directory...\n');

let hasErrors = false;

for (const player of players) {
  console.log(`🎯 ${player.name}:`);
  const sourceBase = join(__dirname, '..', player.source);

  // Verify source base exists
  if (!existsSync(sourceBase)) {
      console.error(`  ✗ Source package not found: ${player.source}. Did you run npm install?`);
      hasErrors = true;
      continue;
  }

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
        if (existsSync(sourcePath)) {
            copyDirectory(sourcePath, destPath);
            console.log(`  ✓ Copied ${dir.from}/ → public/${dir.to}/`);
        } else {
            console.warn(`  ! Source directory not found: ${dir.from} (skipping)`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to copy ${dir.from}/:`, error.message);
        hasErrors = true;
      }
    });
  }
  console.log('');
}

if (hasErrors) {
  console.error('❌ Player files copy failed! Some assets are missing.\n');
  process.exit(1);
}

console.log('✅ Player files copied successfully!\n');
