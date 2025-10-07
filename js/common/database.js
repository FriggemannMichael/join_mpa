let databaseModulePromise = null;

/**
 * Lädt das Firebase Realtime Database SDK einmalig und cached das Modul.
 * @returns {Promise<any>} Firebase Database Modul
 */
export function loadFirebaseDatabase() {
  if (!databaseModulePromise) {
    databaseModulePromise = import(
      "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js"
    );
  }
  return databaseModulePromise;
}
