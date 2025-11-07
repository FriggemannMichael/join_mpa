let databaseModulePromise = null;

/**
 * Loads the Firebase Realtime Database SDK once and caches the module.
 * @returns {Promise<any>} Firebase Database module
 */
export function loadFirebaseDatabase() {
  if (!databaseModulePromise) {
    databaseModulePromise = import(
      "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js"
    );
  }
  return databaseModulePromise;
}
