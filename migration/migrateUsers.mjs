#!/usr/bin/env node
/**
 * Migration Script: Legacy usersdatabase.json -> Firebase Auth + Realtime Database contacts/<uid>
 * Usage: `npm run migrate:users`
 *
 * Modes / Flags (simple parsing):
 *  --reset-mode=keep     (Default) Uses the existing plaintext password (DEV only!).
 *  --reset-mode=random   Generates random password + stores mapping.
 *  --dry-run             Executes no write operation, only shows actions.
 *
 * Output:
 *  - Console log of created or skipped users.
 *  - For random: creates `migration/passwords_created.json` (gitignore!)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Config ----
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'serviceAccountKey.json');
const LEGACY_JSON_PATH = path.join(process.cwd(), 'usersdatabase.json');
const PASSWORD_OUTPUT_PATH = path.join(__dirname, 'passwords_created.json');

// Simple CLI arg parsing
const args = process.argv.slice(2);
function getArg(key, fallback) {
  const found = args.find(a => a.startsWith(`--${key}=`));
  if (!found) return fallback;
  return found.split('=')[1];
}
const resetMode = getArg('reset-mode', 'keep'); // keep | random
const dryRun = args.includes('--dry-run');

if (!fs.existsSync(LEGACY_JSON_PATH)) {
  console.error('Legacy JSON not found:', LEGACY_JSON_PATH);
  process.exit(1);
}
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('Service Account file missing:', SERVICE_ACCOUNT_PATH);
  console.error('Please place serviceAccountKey.json according to MIGRATION.md.');
  process.exit(1);
}

// Load JSON
const legacyRaw = JSON.parse(fs.readFileSync(LEGACY_JSON_PATH, 'utf8'));
const legacyUsers = legacyRaw.users || {};
const legacyEntries = Object.entries(legacyUsers);
if (!legacyEntries.length) {
  process.exit(0);
}

// Init Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://join-31b2e-default-rtdb.europe-west1.firebasedatabase.app/'
});

const adminAuth = getAuth();
const db = getDatabase();

/**
 * Generates a random password.
 * @returns {string}
 */
function randomPassword() {
  return crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
}

/**
 * Normalizes a legacy user object for contact structure.
 */
function toContactProfile(legacy, uid) {
  return {
    uid,
    name: legacy.name || '',
    email: legacy.email || '',
    phone: legacy.phone || '',
    color: legacy.color || '#29ABE2',
    initials: legacy.initials || (legacy.name ? legacy.name.split(/\s+/).map(p => p[0]).join('').toUpperCase().slice(0, 2) : ''),
    createdAt: Date.now(),
    source: 'migration-v1'
  };
}

const passwordMap = {};
let created = 0;
let skipped = 0;

for (const [legacyKey, legacy] of legacyEntries) {
  const email = legacy.email;
  if (!email) {
    console.warn(`Skipped (no email) legacyKey=${legacyKey}`);
    skipped++; continue;
  }
  // Check if user exists
  let existingUser = null;
  try {
    existingUser = await adminAuth.getUserByEmail(email);
  } catch (e) {
    // not found
  }
  let uid;
  let pwdToUse = null;

  if (existingUser) {
    uid = existingUser.uid;
  } else {
    // Determine password
    if (resetMode === 'random') {
      pwdToUse = randomPassword();
      passwordMap[email] = pwdToUse;
    } else {
      // keep (DEV only!)
      pwdToUse = legacy.password && legacy.password.length >= 6 ? legacy.password : 'Temp123!';
    }

    if (dryRun) {

    } else {
      try {
        const cred = await adminAuth.createUser({
          email,
          emailVerified: false,
          password: pwdToUse,
          displayName: legacy.name || '',
          disabled: false
        });
        uid = cred.uid;
        created++;
      } catch (e) {
        console.error(`Error creating user for ${email}:`, e.message);
        skipped++; continue;
      }
    }
  }

  // Write contact profile
  if (uid) {
    const contactRefPath = `contacts/${uid}`;
    const profile = toContactProfile(legacy, uid);
    if (dryRun) {
    } else {
      try {
        await db.ref(contactRefPath).set(profile);
      } catch (e) {
        console.error(`Contact profile error for ${email}:`, e.message);
      }
    }
  }
}

if (!dryRun && resetMode === 'random' && Object.keys(passwordMap).length) {
  fs.writeFileSync(PASSWORD_OUTPUT_PATH, JSON.stringify(passwordMap, null, 2), 'utf8');
}

