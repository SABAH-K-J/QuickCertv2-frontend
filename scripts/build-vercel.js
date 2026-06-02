import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// Only run on Vercel
if (!process.env.VERCEL) {
  process.exit(0);
}

const dist = path.join(root, 'dist');
const vercelOutput = path.join(root, '.vercel', 'output');

if (fs.existsSync(dist)) {
  fs.mkdirSync(path.join(vercelOutput, 'functions', '__server.func'), { recursive: true });
  
  // Move dist/client -> .vercel/output/static
  if (fs.existsSync(path.join(dist, 'client'))) {
    fs.renameSync(path.join(dist, 'client'), path.join(vercelOutput, 'static'));
  }
  
  // Move dist/server -> .vercel/output/functions/__server.func
  if (fs.existsSync(path.join(dist, 'server'))) {
    const serverFiles = fs.readdirSync(path.join(dist, 'server'));
    for (const file of serverFiles) {
      fs.renameSync(
        path.join(dist, 'server', file),
        path.join(vercelOutput, 'functions', '__server.func', file)
      );
    }
  }
  
  // Move dist/config.json -> .vercel/output/config.json
  if (fs.existsSync(path.join(dist, 'config.json'))) {
    fs.renameSync(path.join(dist, 'config.json'), path.join(vercelOutput, 'config.json'));
  }

  console.log("Successfully formatted output for Vercel Build Output API.");
} else {
  console.log("No dist folder found.");
}
