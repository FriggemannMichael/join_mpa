# User Migration (Legacy JSON -> Firebase Authentication + Realtime DB)

Dieses Dokument beschreibt, wie du die alten User aus `usersdatabase.json` nach Firebase überführst.

## Ausgangslage
- Legacy-Datei: `usersdatabase.json` mit Struktur `{"users": {<legacyKey>: { name, email, password, phone, color, initials, id }}}`
- Aktuelle App nutzt Firebase Authentication (E-Mail + Passwort) und optional Realtime Database für Kontakte.
- Passwörter liegen im Klartext vor (unsicher) und sollen bei Migration sicher neu gesetzt oder übernommen werden.

## Ziel
1. Für jeden Legacy-User einen Firebase Auth User anlegen (oder vorhandenen erkennen).
2. Ein Kontaktprofil in der Realtime Database unter `contacts/<uid>` speichern.
3. Klartext-Passwörter werden NICHT im Klartext übernommen – Option:
   - a) Temporär identisches Passwort setzen (nur in Dev) und Benutzer später zum Reset zwingen.
   - b) Generiertes Random-Passwort setzen und Passwort-Reset E-Mail versenden.

## Vorbereitung
1. Service Account JSON aus Firebase Console generieren:
   - Firebase Console → Projekteinstellungen → Service Accounts → "Neuen privaten Schlüssel generieren".
   - Datei speichern als: `./migration/serviceAccountKey.json` (NICHT committen!).
2. In der Realtime Database sicherstellen, dass Schreibrechte für Admin vorhanden sind (Admin SDK umgeht Security Rules).
3. Node.js Umgebung: `npm install` (fügt `firebase-admin` hinzu).

## Skript ausführen
```bash
npm run migrate:users
```

Optional mit Optionen (siehe Kopf des Skripts).

## Nach der Migration
- Prüfe in Firebase Authentication: Alle neuen Benutzer sichtbar?
- Prüfe Realtime Database: `contacts/<uid>` Einträge vorhanden?
- Falls Random-Passwörter gesetzt wurden: Passwort-Reset E-Mails senden oder manuell veranlassen.
- Entferne alte Klartext-Passwörter aus Repo / Git-Historie falls sensibel.

## Sicherheit
- `serviceAccountKey.json` in `.gitignore` aufnehmen.
- Keine Klartext-Passwörter dauerhaft behalten.

## Rollback
- Migration ist idempotent (Skript prüft vorhandene E-Mails) – kannst es mehrfach laufen lassen.
- Zum Entfernen: Manuell Benutzer in Auth löschen + Kontakteinträge entfernen.

## Erweiterungen (später)
- Logging in Datei.
- Dry-Run Modus.
- Mapping-Datei generieren (legacyKey -> newUid).

Viel Erfolg! Siehe `migrateUsers.mjs` für Details.
