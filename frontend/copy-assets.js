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

// Collection Editor paths
const collectionEditorWebComponentRoot = path.join(
    __dirname,
    'node_modules/@project-sunbird/sunbird-collection-editor-web-component'
);
const collectionEditorAssetsSource = path.join(collectionEditorWebComponentRoot, 'assets/collection-editor');
const collectionEditorFinalDest = path.join(publicRoot, 'assets/collection-editor');

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

    // 6. Copy Collection Editor assets
    console.log(`\n📂 Collection Editor Source: ${collectionEditorAssetsSource}`);
    fs.mkdirSync(collectionEditorFinalDest, { recursive: true });
    console.log('📦 Copying Collection Editor files to public/assets/collection-editor/...');
    copyDirectory(collectionEditorAssetsSource, collectionEditorFinalDest);
    
    // 7. Copy COMMON assets (icons) to root assets folder
    // Many Sunbird components expect icons at /assets/*.svg
    console.log('\n📦 Copying common icons to public/assets/ for shared access...');
    
    // Copy PDF icons first
    const pdfIcons = fs.readdirSync(pdfAssetsSource).filter(file => file.endsWith('.svg'));
    for (const icon of pdfIcons) {
        fs.copyFileSync(
            path.join(pdfAssetsSource, icon),
            path.join(publicRoot, 'assets', icon)
        );
    }

    // Copy QUML icons second (this will override PDF icons if there are duplicates)
    const qumlIconsDir = path.join(qumlAssetsSource, 'assets');
    if (fs.existsSync(qumlIconsDir)) {
        const qumlIcons = fs.readdirSync(qumlIconsDir).filter(file => file.endsWith('.svg'));
        for (const icon of qumlIcons) {
            fs.copyFileSync(
                path.join(qumlIconsDir, icon),
                path.join(publicRoot, 'assets', icon)
            );
        }
    }

    console.log('\n✅ Assets consolidated successfully!');
    console.log(`📍 Video Player: public/assets/video-player/`);
    console.log(`📍 ePub Player: public/assets/epub-player/`);
    console.log(`📍 QUML Player: public/assets/quml-player/`);
    console.log(`📍 Collection Editor: public/assets/collection-editor/`);
    console.log(`📍 Common Icons: public/assets/*.svg`);

} catch (error) {
    console.error('❌ Error consolidating assets:', error.message);
    process.exit(1);
}