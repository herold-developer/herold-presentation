#!/usr/bin/env node

/**
 * Download Kokoro TTS models
 * 
 * This script downloads the required Kokoro models to ~/.cache/kokoro-models
 * so they don't need to be stored in git.
 * 
 * Usage: node scripts/download-kokoro-models.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KOKORO_MODEL_DIR = path.join(process.env.HOME, '.cache', 'kokoro-models');
const KOKORO_GITHUB_REPO = 'hexgrad/Kokoro';
const KOKORO_RELEASE_TAG = 'v0.2.0'; // Update as needed

const MODELS = [
  'kokoro-v0_19.onnx',
  'voices.json',
];

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`⬇️  Downloading ${path.basename(destPath)}...`);

    const file = fs.createWriteStream(destPath);
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded ${path.basename(destPath)}`);
        resolve();
      });
    });

    request.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });

    file.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  try {
    // Create model directory if it doesn't exist
    if (!fs.existsSync(KOKORO_MODEL_DIR)) {
      fs.mkdirSync(KOKORO_MODEL_DIR, { recursive: true });
      console.log(`📁 Created ${KOKORO_MODEL_DIR}`);
    }

    console.log(`\n🎤 Setting up Kokoro TTS models...\n`);

    let hasExisting = false;
    for (const model of MODELS) {
      const modelPath = path.join(KOKORO_MODEL_DIR, model);
      if (fs.existsSync(modelPath)) {
        console.log(`✓ ${model} already exists`);
        hasExisting = true;
      }
    }

    if (hasExisting) {
      console.log('\n✅ Kokoro models are ready!');
      return;
    }

    // Download models from GitHub releases
    const releaseUrl = `https://api.github.com/repos/${KOKORO_GITHUB_REPO}/releases/tags/${KOKORO_RELEASE_TAG}`;
    
    console.log(`📥 Fetching release info from ${KOKORO_GITHUB_REPO}@${KOKORO_RELEASE_TAG}...\n`);

    // Try to download from GitHub releases
    try {
      const response = await fetch(releaseUrl);
      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const release = await response.json();
      const assets = release.assets || [];

      for (const model of MODELS) {
        const asset = assets.find((a) => a.name === model);
        if (!asset) {
          console.warn(`⚠️  ${model} not found in release assets`);
          continue;
        }

        const destPath = path.join(KOKORO_MODEL_DIR, model);
        await downloadFile(asset.browser_download_url, destPath);
      }

      console.log('\n✅ Kokoro models downloaded successfully!');
      console.log(`📁 Models stored in: ${KOKORO_MODEL_DIR}`);
      console.log('\nNow you can generate audio with:');
      console.log('  npm run generate-audio -- --tts-provider kokoro');
    } catch (err) {
      console.error('\n❌ Failed to download from GitHub:', err.message);
      console.error('\nAlternative: Clone the Kokoro repository and copy models manually:');
      console.error(`  git clone https://github.com/${KOKORO_GITHUB_REPO}.git`);
      console.error(`  cp Kokoro/*.onnx ${KOKORO_MODEL_DIR}/`);
      console.error(`  cp Kokoro/voices.json ${KOKORO_MODEL_DIR}/`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
