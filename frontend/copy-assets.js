import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n📦 Consolidating all assets...\n');

// Source paths
const publicRoot = path.join(__dirname, 'public');

// PDF Player paths
const pdfWebComponentRoot = path.join(
    __dirname,
    'node_modules/@project-sunbird/sunbird-pdf-player-web-component'
);
const pdfAssetsSource = path.join(pdfWebComponentRoot, 'assets/pdf-player');
const pdfFinalDest = path.join(publicRoot, 'assets/pdf-player');

// Video Player paths
const videoWebComponentRoot = path.join(
    __dirname,
    'node_modules/@project-sunbird/sunbird-video-player-web-component'
);
const videoAssetsSource = path.join(videoWebComponentRoot, 'assets/video-player');
const videoFinalDest = path.join(publicRoot, 'assets/video-player');

// ePub Player paths
const epubWebComponentRoot = path.join(
    __dirname,
    'node_modules/@project-sunbird/sunbird-epub-player-web-component'
);
const epubAssetsSource = path.join(epubWebComponentRoot, 'assets/epub-player');
const epubFinalDest = path.join(publicRoot, 'assets/epub-player');

// QUML Player paths
const qumlWebComponentRoot = path.join(
    __dirname,
    'node_modules/@project-sunbird/sunbird-quml-player-web-component'
);
const qumlAssetsSource = path.join(qumlWebComponentRoot, 'assets/quml-player');
const qumlFinalDest = path.join(publicRoot, 'assets/quml-player');
const qumlLegacyPlayerFile = path.join(publicRoot, 'assets', 'sunbird-quml-player.js');

// QUML Editor paths
const qumlEditorWebComponentRoot = path.join(
    __dirname,
    'node_modules/@project-sunbird/sunbird-questionset-editor-web-component'
);
const qumlEditorAssetsSource = path.join(qumlEditorWebComponentRoot, 'assets/quml-editor');
const qumlEditorFinalDest = path.join(publicRoot, 'assets/quml-editor');
const qumlEditorImagesSource = path.join(qumlEditorAssetsSource, 'assets/images');
const qumlEditorIconsSource = path.join(qumlEditorAssetsSource, 'assets');
const sharedImagesDest = path.join(publicRoot, 'assets/images');
const sharedAssetsDest = path.join(publicRoot, 'assets');

/**
 * Recursively copy directory
 */
function copyDirectory(src, dest) {
    if (!fs.existsSync(src)) {
        throw new Error(
            `Source directory "${src}" does not exist. This may indicate a missing npm package or an incorrect path.`
        );
    }
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function copyFilesWithExtensions(src, dest, extensions) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) continue;
        if (!extensions.some(ext => entry.name.endsWith(ext))) continue;
        fs.copyFileSync(path.join(src, entry.name), path.join(dest, entry.name));
    }
}

try {
    // 1. Clean up ALL previous asset folders to start fresh
    const legacyAssets = path.join(publicRoot, 'assets');
    if (fs.existsSync(legacyAssets)) {
        console.log('🧹 Cleaning existing assets folder...');
        fs.rmSync(legacyAssets, { recursive: true, force: true });
    }

    // 2. Copy PDF Player assets
    console.log(`\n📂 PDF Player Source: ${pdfAssetsSource}`);
    fs.mkdirSync(pdfFinalDest, { recursive: true });
    console.log('📦 Copying PDF player files to public/assets/pdf-player/...');
    copyDirectory(pdfAssetsSource, pdfFinalDest);

    // Move local-guide.pdf if it exists in root public
    const pdfInRoot = path.join(publicRoot, 'local-guide.pdf');
    const pdfInAssets = path.join(pdfFinalDest, 'local-guide.pdf');
    if (fs.existsSync(pdfInRoot)) {
        fs.renameSync(pdfInRoot, pdfInAssets);
        console.log('✅ Moved local-guide.pdf to public/assets/pdf-player/');
    }

    // 3. Copy Video Player assets
    console.log(`\n📂 Video Player Source: ${videoAssetsSource}`);
    fs.mkdirSync(videoFinalDest, { recursive: true });
    console.log('📦 Copying video player files to public/assets/video-player/...');
    copyDirectory(videoAssetsSource, videoFinalDest);

    // 4. Copy ePub Player assets
    console.log(`\n📂 ePub Player Source: ${epubAssetsSource}`);
    fs.mkdirSync(epubFinalDest, { recursive: true });
    console.log('📦 Copying ePub player files to public/assets/epub-player/...');
    copyDirectory(epubAssetsSource, epubFinalDest);

    // 5. Copy QUML Player assets
    console.log(`\n📂 QUML Player Source: ${qumlAssetsSource}`);
    fs.mkdirSync(qumlFinalDest, { recursive: true });
    console.log('📦 Copying QUML player files to public/assets/quml-player/...');
    copyDirectory(qumlAssetsSource, qumlFinalDest);
    // Also place legacy player file at /assets/sunbird-quml-player.js to satisfy older loader paths
    const playerBundle = path.join(qumlFinalDest, 'sunbird-quml-player.js');
    if (fs.existsSync(playerBundle)) {
        fs.copyFileSync(playerBundle, qumlLegacyPlayerFile);
        console.log('✅ Copied legacy sunbird-quml-player.js to public/assets/');
    }

    // 6. Copy QUML Editor assets (if package is installed)
    if (fs.existsSync(qumlEditorWebComponentRoot)) {
        console.log(`\n📂 QUML Editor Source: ${qumlEditorAssetsSource}`);
        fs.mkdirSync(qumlEditorFinalDest, { recursive: true });
        console.log('📦 Copying QUML editor files to public/assets/quml-editor/...');
        copyDirectory(qumlEditorAssetsSource, qumlEditorFinalDest);

        // Copy QUML editor images to /assets/images so absolute paths continue to work
        if (fs.existsSync(qumlEditorImagesSource)) {
            console.log('🖼️  Copying QUML editor images to public/assets/images/...');
            copyDirectory(qumlEditorImagesSource, sharedImagesDest);
        }

        // Copy QUML editor icons/SVGs to /assets for shared access
        if (fs.existsSync(qumlEditorIconsSource)) {
            console.log('📦 Copying QUML editor icons to public/assets/...');
            copyFilesWithExtensions(qumlEditorIconsSource, sharedAssetsDest, ['.svg', '.png', '.jpg']);
        }
    } else {
        console.log('\n⚠️  QUML Editor package not found - skipping (install @project-sunbird/lib-questionset-editor when available)');
    }

    // 7. Copy COMMON assets (icons) to root assets folder
    // Many Sunbird components expect icons at /assets/*.svg
    console.log('\n📦 Copying common icons to public/assets/ for shared access...');
    
    // Copy PDF icons first
    const pdfIcons = fs.readdirSync(pdfAssetsSource).filter(file => file.endsWith('.svg'));
    copyFilesWithExtensions(pdfAssetsSource, path.join(publicRoot, 'assets'), ['.svg']);

    // Copy QUML icons second (this will override PDF icons if there are duplicates)
    const qumlIconsDir = path.join(qumlAssetsSource, 'assets');
    if (fs.existsSync(qumlIconsDir)) {
        copyFilesWithExtensions(qumlIconsDir, path.join(publicRoot, 'assets'), ['.svg']);
    }

    console.log('\n✅ Assets consolidated successfully!');
    console.log(`📍 Video Player: public/assets/video-player/`);
    console.log(`📍 ePub Player: public/assets/epub-player/`);
    console.log(`📍 QUML Player: public/assets/quml-player/`);
    console.log(`📍 QUML Editor: public/assets/quml-editor/`);
    console.log(`📍 QUML Editor Images: public/assets/images/`);
    console.log(`📍 Common Icons: public/assets/*.svg`);

} catch (error) {
    console.error('❌ Error consolidating assets:', error.message);
    process.exit(1);
}