import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const libs = [
  {
    name: 'sunbird-quml-player-web-component',
    src: path.join(__dirname, '../node_modules/@project-sunbird/sunbird-quml-player-web-component'),
    dest: path.join(__dirname, '../public/libs/sunbird-quml-player-web-component'),
  },
];

libs.forEach((lib) => {
  if (fs.existsSync(lib.src)) {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(lib.dest)) {
      fs.mkdirSync(lib.dest, { recursive: true });
    }

    // Copy files recursively
    fs.cp(lib.src, lib.dest, { recursive: true }, (err) => {
      if (err) {
        console.error(`Error copying ${lib.name}:`, err);
      } else {
        console.log(`Successfully copied ${lib.name} to ${lib.dest}`);
      }
    });
  } else {
    console.error(`Source not found for ${lib.name}: ${lib.src}`);
  }
});
