#!/usr/bin/env node
/**
 * Migration Script: Legacy usersdatabase.json -> Firebase Auth + Realtime Database contacts/<uid>
 * Usage: `npm run migrate:users`
 *
 * Modes / Flags (simple parsing):
 *  --reset-mode=keep     (Default) Verwendet das vorhandene Klartext-Passwort (nur DEV!).
 *  --reset-mode=random   Generiert random Passwort + speichert Mapping.
 *  --dry-run             Führt keinen Schreibvorgang aus, zeigt nur Aktionen.
 *
 * Output:
 *  - Console Log von erstellten oder übersprungenen Nutzern.
 *  - Bei random: erstellt `migration/passwords_created.json` (gitignore!)
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
  console.error('Legacy JSON nicht gefunden:', LEGACY_JSON_PATH);
  process.exit(1);
}
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('Service Account Datei fehlt:', SERVICE_ACCOUNT_PATH);
  console.error('Bitte serviceAccountKey.json gemäß MIGRATION.md ablegen.');
  process.exit(1);
}

// Load JSON
const legacyRaw = JSON.parse(fs.readFileSync(LEGACY_JSON_PATH, 'utf8'));
const legacyUsers = legacyRaw.users || {};
const legacyEntries = Object.entries(legacyUsers);
if (!legacyEntries.length) {
  console.log('Keine Legacy-User gefunden. Abbruch.');
  process.exit(0);
}
console.log(`Gefundene Legacy-User: ${legacyEntries.length}`);

// Init Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://join-31b2e-default-rtdb.europe-west1.firebasedatabase.app/'
});

const adminAuth = getAuth();
const db = getDatabase();

/**
 * Erzeugt ein zufälliges Passwort.
 * @returns {string}
 */
function randomPassword() {
  return crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
}

/**
 * Normalisiert ein Legacy User Objekt für Contact Struktur.
 */
function toContactProfile(legacy, uid) {
  return {
    uid,
    name: legacy.name || '',
    email: legacy.email || '',
    phone: legacy.phone || '',
    color: legacy.color || '#29ABE2',
    initials: legacy.initials || (legacy.name ? legacy.name.split(/\s+/).map(p => p[0]).join('').toUpperCase().slice(0,2) : ''),
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
    console.warn(`Übersprungen (kein Email) legacyKey=${legacyKey}`);
    skipped++; continue;
  }
  // Prüfen ob User existiert
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
    console.log(`Vorhanden: ${email} -> UID=${uid}`);
  } else {
    // Passwort bestimmen
    if (resetMode === 'random') {
      pwdToUse = randomPassword();
      passwordMap[email] = pwdToUse;
    } else {
      // keep (nur DEV!)
      pwdToUse = legacy.password && legacy.password.length >= 6 ? legacy.password : 'Temp123!';
    }

    if (dryRun) {
      console.log(`[DRY-RUN] Würde User anlegen: ${email}`);
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
        console.log(`Angelegt: ${email} -> UID=${uid}`);
        created++;
      } catch (e) {
        console.error(`Fehler beim Anlegen für ${email}:`, e.message);
        skipped++; continue;
      }
    }
  }

  // Kontaktprofil schreiben
  if (uid) {
    const contactRefPath = `contacts/${uid}`;
    const profile = toContactProfile(legacy, uid);
    if (dryRun) {
      console.log(`[DRY-RUN] Würde Kontaktprofil schreiben: ${contactRefPath}`);
    } else {
      try {
        await db.ref(contactRefPath).set(profile);
      } catch (e) {
        console.error(`Kontaktprofil Fehler für ${email}:`, e.message);
      }
    }
  }
}

if (!dryRun && resetMode === 'random' && Object.keys(passwordMap).length) {
  fs.writeFileSync(PASSWORD_OUTPUT_PATH, JSON.stringify(passwordMap, null, 2), 'utf8');
  console.log('Random Passwörter gespeichert in', PASSWORD_OUTPUT_PATH);
}

console.log('--- Migration Summary ---');
console.log('Neu angelegt:', created);
console.log('Übersprungen/Vorhanden/Fehler:', skipped);
console.log('Reset Mode:', resetMode, 'DryRun:', dryRun);

console.log('Fertig.');
