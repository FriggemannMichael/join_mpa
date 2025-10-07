import { auth } from "./firebase.js";
import { loadFirebaseDatabase } from "./database.js";

const RETRY_LIMIT = 3;
const RETRY_DELAY = 250;
const activeUids = new Set();

export async function provisionActiveUser() {
  const user = auth.currentUser;
  if (!canProvision(user)) return;
  activeUids.add(user.uid);
  try {
    const db = await loadFirebaseDatabase();
    await ensureUserEntry(user, db);
    await ensureContactEntry(user, db);
  } finally {
    activeUids.delete(user.uid);
  }
}

function canProvision(user) {
  if (!user) return false;
  if (user.uid === "guest-user") return false;
  return !activeUids.has(user.uid);
}

async function ensureUserEntry(user, db) {
  const ref = db.ref(db.getDatabase(), `users/${user.uid}`);
  const existing = await readSnapshot(db, ref);
  const values = buildUserPayload(user, existing);
  await writeWithRetry(db, ref, values);
}

async function ensureContactEntry(user, db) {
  const ref = db.ref(db.getDatabase(), `contacts/${user.uid}`);
  const existing = await readSnapshot(db, ref);
  const values = buildContactPayload(user, existing);
  await writeWithRetry(db, ref, values);
}

async function readSnapshot(db, ref) {
  try {
    const snap = await db.get(ref);
    return snap.exists() ? snap.val() : null;
  } catch {
    return null;
  }
}

async function writeWithRetry(db, ref, values) {
  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt += 1) {
    try {
      await db.set(ref, values);
      return;
    } catch {
      await delay(RETRY_DELAY * attempt);
    }
  }
}

function buildUserPayload(user, existing) {
  const base = existing || {};
  const entry = {
    ...base,
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    provider: readProvider(user),
  };
  return withTimestamps(entry, existing);
}

function buildContactPayload(user, existing) {
  const base = existing || {};
  const entry = {
    ...base,
    uid: user.uid,
    name: readName(user),
    email: user.email || "",
    phone: base.phone || "",
    color: pickColor(user.uid),
    initials: buildInitials(readName(user)),
  };
  return withTimestamps(entry, existing);
}

function readProvider(user) {
  const provider = user.providerData?.[0]?.providerId;
  return provider || "password";
}

function readName(user) {
  if (user.displayName) return user.displayName;
  if (!user.email) return "";
  return user.email.split("@")[0];
}

function withTimestamps(entry, existing) {
  if (!existing) entry.createdAt = Date.now();
  entry.updatedAt = Date.now();
  return entry;
}

function pickColor(uid) {
  let hash = 0;
  for (let i = 0; i < uid.length; i += 1) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  }
  return hslToHex(hash % 360, 65, 55);
}

function buildInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function hslToHex(h, s, l) {
  const sat = s / 100;
  const lig = l / 100;
  const f = (n) => computeChannel(n, h, sat, lig);
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function computeChannel(n, h, s, l) {
  const k = (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
}

function toHex(value) {
  return Math.round(value * 255)
    .toString(16)
    .padStart(2, "0");
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
