import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Resolve this file's dir (server/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common candidate locations for your .env
const candidates = [
  // project root (one level above server/)
  path.join(__dirname, '..', '.env'),

  // inside server/ (if you decide to keep it there)
  path.join(__dirname, '.env'),

  // process working dir (where you run `npm run dev`)
  path.resolve(process.cwd(), '.env'),
];

const envPath = candidates.find((p) => fs.existsSync(p));

if (!envPath) {
  console.warn('[env] No .env file found. Checked:');
  for (const p of candidates) console.warn(' -', p);
} else {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.warn(`[env] Failed to load .env at ${envPath}: ${result.error.message}`);
  } else {
    const keys = Object.keys(result.parsed || {});
    console.log(`[env] Loaded ${keys.length} env var(s) from ${envPath}`);
  }
}

// Quick sanity checks (won’t crash app)
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[env] STRIPE_SECRET_KEY is missing. Stripe will fail to initialize.');
}
if (!process.env.FX_LKR_PER_USD) {
  console.warn('[env] FX_LKR_PER_USD not set; default will be used (e.g., 300).');
}

// No exports needed; simply importing this file sets process.env
export {};