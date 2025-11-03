# Demo Data Seeding

Dieses Script erstellt JSON-Export-Dateien mit Demo-Daten (Tasks und Contacts) für den Guest-User und Testzwecke.

## Ausführung

```bash
npm run seed:demo
```

Dies generiert zwei JSON-Dateien im `scripts/output/` Ordner:
- `contacts.json` - 8 Demo-Kontakte
- `tasks.json` - 7 Demo-Tasks

## Manuelle Import-Anleitung

1. **Firebase Console öffnen**: https://console.firebase.google.com/
2. **Projekt auswählen**: join-project-7569c
3. **Realtime Database öffnen**
4. **Import JSON**:
   - Klicke auf das ⋮ Menü (drei Punkte)
   - Wähle "Import JSON"
   - Wähle die entsprechende JSON-Datei
   - Gib den Pfad an:
     - `/contacts` für contacts.json
     - `/tasks` für tasks.json

## Was wird erstellt?

### Demo Contacts (8 Kontakte)
- Anton Mayer
- Anja Schulz
- Benedikt Ziegler
- David Eisenberg
- Eva Fischer
- Emmanuel Mauer
- Marcel Bauer
- Tatjana Wolf

Jeder Kontakt hat:
- Name
- E-Mail
- Telefonnummer
- Farbe für Avatar

### Demo Tasks (7 Tasks)
Verschiedene Tasks mit unterschiedlichen:
- **Status**: toDo (2), inProgress (2), awaitFeedback (1), done (2)
- **Prioritäten**: urgent (3), medium (2), low (2)
- **Kategorien**: User Story, Technical Task
- **Assignees**: Verschiedene Demo-Kontakte
- **Subtasks**: Mit teilweise erledigten Aufgaben
- **Due Dates**: Verschiedene Termine

## Guest-User

Der Guest-User (`guest-user`) kann nach dem Import:
- ✅ Alle Demo-Tasks auf dem Board sehen und verwalten
- ✅ Alle Demo-Contacts in der Contact-Liste sehen
- ✅ Mit den Demo-Daten arbeiten (ansehen, erstellen, bearbeiten, löschen)
- ✅ Die Funktionsweise der App testen ohne eigenen Account

Die Daten werden in Firebase unter den Standard-Pfaden gespeichert:
- `/tasks/*` - Alle Tasks (sichtbar für alle Benutzer)
- `/contacts/*` - Alle Contacts (sichtbar für alle Benutzer)

## Hinweise

⚠️ **Wichtig**: 
- Firebase Security Rules sollten entsprechend konfiguriert sein
- Demo-Daten sind für alle Benutzer sichtbar
- Bei Bedarf können die Daten in Firebase manuell gelöscht werden
- Die generierten JSON-Dateien werden nicht ins Repository committed (`.gitignore`)
