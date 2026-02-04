#!/usr/bin/env node
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const source = join(projectRoot, 'node_modules/@project-sunbird/sunbird-pdf-player-web-component/assets');
const target = join(projectRoot, 'public/assets');

console.log('📦 Setting up PDF Player assets...');

// Check if source exists
if (!existsSync(source)) {
    console.error('❌ Source assets not found. Please run: npm install');
    process.exit(1);
}

// Create target directory
if (!existsSync(target)) {
    console.log('📁 Creating public/assets directory...');
    mkdirSync(target, { recursive: true });
}

// Recursive copy function
function copyRecursive(src, dest) {
    if (!existsSync(src)) return;

    const stat = statSync(src);

    if (stat.isDirectory()) {
        if (!existsSync(dest)) {
            mkdirSync(dest, { recursive: true });
        }

        const entries = readdirSync(src);
        for (const entry of entries) {
            copyRecursive(join(src, entry), join(dest, entry));
        }
    } else {
        // Create parent directory if it doesn't exist
        const destDir = dirname(dest);
        if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
        }
        copyFileSync(src, dest);
    }
}

try {
    console.log('📋 Copying assets from node_modules...');
    copyRecursive(source, target);
    console.log('✅ PDF Player assets copied successfully!');
    console.log(`   From: ${source}`);
    console.log(`   To:   ${target}`);
} catch (error) {
    console.error('❌ Failed to copy assets:', error.message);
    process.exit(1);
}
