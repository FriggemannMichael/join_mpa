# Firebase Security Rules für Guest-Zugriff

## Problem
Der Guest-User kann keine Tasks und Contacts sehen, obwohl eingeloggte User diese sehen können.

## Ursache
- Guest-User ist **nicht in Firebase authentifiziert** (`auth == null`)
- Firebase Security Rules blockieren Lesezugriff für nicht-authentifizierte User
- Eingeloggte User haben `auth != null` und können lesen

## Lösung

Die Firebase Realtime Database Rules müssen angepasst werden:

### Vorher (blockiert Guest):
```json
{
  "rules": {
    "tasks": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### Nachher (erlaubt Guest Lesezugriff):
```json
{
  "rules": {
    "tasks": {
      ".read": true,
      ".write": "auth != null"
    },
    "contacts": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

## Implementierung

### Schritt 1: Firebase Console öffnen
https://console.firebase.google.com/project/join-project-7569c/database/join-project-7569c-default-rtdb/rules

### Schritt 2: Rules kopieren
Kopieren Sie den Inhalt aus `firebase-rules-guest-access.json`

### Schritt 3: In Firebase einfügen
1. Öffnen Sie den "Rules" Tab in der Realtime Database
2. Ersetzen Sie die aktuellen Rules
3. Klicken Sie "Publish"

## Sicherheit

✅ **Sicher für Production:**
- Jeder kann Tasks und Contacts **lesen** (read-only für Guest)
- Nur authentifizierte User können **schreiben** (create, update, delete)
- User-spezifische Daten bleiben geschützt

⚠️ **Beachten Sie:**
- Guest kann Tasks/Contacts nur **ansehen**, nicht bearbeiten
- Wenn Guest schreiben soll, muss `.write: true` gesetzt werden (unsicherer)

## Alternative: Guest mit Firebase Auth erstellen

Für mehr Sicherheit könnte man einen echten Firebase Guest-Account erstellen:
```javascript
// In startGuestSession()
const guestAuth = await signInAnonymously(auth);
```

Dies würde `auth != null` erfüllen und die Rules müssten nicht geändert werden.
