const errorMessages = {
  "auth/invalid-email": "Ungültige E-Mail-Adresse",
  "auth/user-disabled": "Benutzer deaktiviert",
  "auth/user-not-found": "Benutzer nicht gefunden",
  "auth/wrong-password": "Falsches Passwort",
  "auth/too-many-requests": "Zu viele Versuche – bitte später erneut",
  "auth/email-already-in-use": "E-Mail wird bereits verwendet",
  "auth/weak-password": "Passwort ist zu schwach (mind. 6 Zeichen)",
};

export function mapFirebaseError(err) {
  if (!err || !err.code) return "Unbekannter Fehler";
  return errorMessages[err.code] || "Login fehlgeschlagen";
}
