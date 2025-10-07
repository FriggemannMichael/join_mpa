# 🚀 JOIN MPA - User Migration Guide

**Team Guide für die Migration von Legacy-Usern zu Firebase**

Hey Team! 👋  
Hier ist eine schnelle Anleitung, wie wir unsere alten User aus der JSON-Datei zu Firebase migrieren können.

## 📋 Was wir vorhaben

Wir haben noch alte User-Daten in `usersdatabase.json` liegen, die wir jetzt ordentlich zu Firebase Authentication überführen wollen. Gleichzeitig erstellen wir Kontaktprofile in der Realtime Database.

### Aktuelle Situation:

- **Legacy-File:** `usersdatabase.json` mit User-Objekten
- **Neue App:** Firebase Authentication + Realtime Database
- **Problem:** Passwörter liegen im Klartext vor (nicht sicher!)

## 🎯 Das Ziel

1. ✅ Firebase Auth User für jeden Legacy-User erstellen
2. ✅ Kontaktprofil in Realtime DB speichern (`contacts/<uid>`)
3. ✅ Sichere Passwort-Behandlung (kein Klartext!)

## 🛠 Setup (einmalig)

### Firebase Service Account Key generieren:

1. Firebase Console öffnen → Projekteinstellungen → Service Accounts
2. "Neuen privaten Schlüssel generieren" klicken
3. JSON-Datei speichern als: `./migration/serviceAccountKey.json`
4. **WICHTIG:** Diese Datei NIEMALS committen! (steht schon in .gitignore)

### Database Permissions:

- Admin SDK umgeht die Security Rules automatisch
- Realtime Database sollte bereit sein

### Dependencies:

```bash
npm install
```

(Das `firebase-admin` Package ist schon in der package.json)

## 🚀 Migration starten

Einfach diesen Befehl ausführen:

```bash
npm run migrate:users
```

Das Skript ist **idempotent** - ihr könnt es mehrfach laufen lassen ohne Probleme!

## ✅ Nach der Migration prüfen

### Firebase Authentication:

- Console öffnen → Authentication → Users
- Alle neuen User sollten dort sichtbar sein

### Realtime Database:

- Console öffnen → Realtime Database
- Unter `contacts/<uid>` sollten die Profile stehen

### Passwörter:

- Falls Random-Passwörter generiert wurden → Password-Reset E-Mails versenden
- User informieren, dass sie sich neu anmelden müssen

## 🔒 Sicherheits-Checklist

- [ ] `serviceAccountKey.json` ist in .gitignore
- [ ] Keine Klartext-Passwörter in Code/Commits
- [ ] Legacy JSON-Datei nach Migration sicher löschen/archivieren

## 🔄 Rollback (falls nötig)

Das Skript prüft bereits vorhandene E-Mail-Adressen, daher:

- **Safe:** Migration mehrfach ausführbar
- **Manual Cleanup:** User in Firebase Auth löschen + DB-Einträge entfernen

## 📝 TODOs für später

- [ ] Logging in separate Datei
- [ ] Dry-Run Modus implementieren
- [ ] Mapping-Datei erstellen (legacyKey → newUid)

## 💡 Tipps

- Testet zuerst mit einem kleineren Datensatz
- Macht ein Backup der Firebase Auth Users vor größeren Migrationen
- Bei Problemen: Schaut in `migrateUsers.mjs` für Details

**Happy Migrating! 🎉**

---

_Bei Fragen: Slack me oder Issue im Repo erstellen_
