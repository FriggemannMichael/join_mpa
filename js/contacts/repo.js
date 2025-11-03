import { db } from "../common/firebase.js";
import {
  ref,
  onValue,
  push,
  set,
  remove,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { extractContactsFromSnapshot, renderContactList } from "./list.js";

/**
 * Loads all contacts from Firebase and renders the contact list.
 * Sets up a real-time listener to update the list when data changes.
 *
 * @async
 * @returns {Promise<void>} Resolves once the initial contact data is rendered.
 */
export async function loadAndRenderContacts() {
  const list = document.getElementById("contact-list");
  if (!list) return;
  const contactsRef = ref(db, "/contacts");
  onValue(contactsRef, (snapshot) => {
    const contacts = extractContactsFromSnapshot(snapshot);
    renderContactList(contacts);
  });
}

/**
 * Extracts all contact objects from a Firebase snapshot.
 * Converts the snapshot into a flat array of contact entries with their unique keys.
 *
 * @param {import("firebase/database").DataSnapshot} snapshot - The Firebase snapshot containing contact data.
 * @returns {Array<{ key: string, name?: string, email?: string, phone?: string }>} The extracted list of contacts.
 */
export function extractContactsFromSnapshot(snapshot) {
  const contacts = [];
  snapshot.forEach((child) => {
    contacts.push({ key: child.key, ...child.val() });
  });
  return contacts;
}


/**
 * Saves a new contact entry to Firebase Realtime Database.
 * Pushes the contact data to the "/contacts" collection as a new record.
 *
 * @async
 * @param {{ name: string, email: string, phone?: string }} data - The contact data to be saved.
 * @returns {Promise<void>} Resolves once the contact has been successfully stored in Firebase.
 */
export async function saveContactToFirebase(data) {
  const contactsRef = ref(db, "/contacts");
  await set(push(contactsRef), data);
}

// Diese beiden Exporte brauchst du in detail.js (keine Verhaltensänderung):
export { db, ref, remove };
