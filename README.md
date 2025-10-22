# Join - Kanban Project Management Tool

Ein leichtgewichtiges Kanban- / Task- und Kontakt-Management Tool mit Vanilla JavaScript (ES Modules) und Firebase Authentication.

## 🎯 Projektübersicht

Aktueller Stand: **Multi Page Application (MPA)** mit dedizierten HTML-Dokumenten pro Bereich. Öffentliche Seiten (`index.html`, `signup.html`, `privacy.html`, `legal.html`) stehen ohne Auth zur Verfügung. Authentifizierte Seiten (`summary.html`, `board.html`, `add-task.html`, `contacts.html`, `profile.html`, `settings.html`) schützen sich beim Laden über einen gemeinsamen Auth-Guard. Header und Sidebar werden als Templates ausgeliefert und pro Seite dynamisch eingebunden.

### Modale & SVG-Icon-Integration

- **Kontakt-Modale**: Für das Erstellen und Bearbeiten von Kontakten werden eigene Modale verwendet (`contacts.html`).
- **Input-Icons**: Alle relevanten Input-Felder (Name, Email, Telefon) besitzen rechts ein Icon (`<span class="input__icon--right">`), das per JS aus `svg-template.js` gesetzt wird.
- **SVG-Icons**: Die Icons werden zentral in `js/common/svg-template.js` als String-Objekte verwaltet und dynamisch per `innerHTML` in die jeweiligen `<span>`- oder Button-Elemente eingefügt.
- **Button-Icons**: Die Save-/Create-Buttons in den Modalen nutzen SVG-Icons (z. B. `checkwhite`), die immer in der gewünschten Farbe (z. B. weiß) per JS gesetzt werden. CSS-Hover-Effekte werden gezielt überschrieben, um die Farbe zu fixieren.

## 📁 Projektstruktur (Ist-Zustand)

```
join/
├── index.html                 # Login / Landing (öffentlich)
├── signup.html                # Registrierung (öffentlich)
├── summary.html               # Dashboard (authentifiziert)
├── board.html                 # Kanban Board (authentifiziert)
├── add-task.html              # Task-Formular (authentifiziert)
├── contacts.html              # Kontakte (authentifiziert)
├── profile.html               # Profil (authentifiziert)
├── settings.html              # Einstellungen (authentifiziert)
├── privacy.html               # Datenschutzerklärung (öffentlich)
├── legal.html                 # Impressum (öffentlich)
├── css/
│   ├── root.css               # Design Tokens / Reset
│   ├── main.css               # Layout / Navigation / Standalone Pages
│   └── *.css                  # Feature-spezifische Styles (Contacts, Board, …)
│   ├── modal.css             # Modale für Kontakte, inkl. Icon-Positionierung
├── img/
│   ├── icon/                  # SVGs & PNGs
│   └── fonts/                 # Schriftdateien (Inter)
├── js/
│   ├── common/                # Shared Utilities & Services (Firebase, Auth, Layout)
│   │   ├── svg-template.js   # Zentrale SVG-Icon-Sammlung (dynamisch)
│   └── pages/                 # Seiten-spezifische Controller (login, summary, …)
├── templates/
│   ├── header.html            # Partials für Layout-Shell
│   └── sidebar.html
├── documentation/             # Generierte JSDoc Dateien (Output)
├── migration/                 # Migrationsskripte / Datenübernahmen
├── olddata/                   # Altbestand (statisch / vor Refactor)
├── package.json
├── STRUCTURE.md
└── README.md
```

> Geplante zusätzliche Persistenz (Tasks, mehrere Kontakte) folgt nach Stabilisierung des Auth / Provisioning Flows.

## 🧾 JSDoc Konventionen

- `@module` pro zentraler Datei (main, auth, firebase, header, sidebar, summary)
- `@function`, `@param`, `@returns` für exportierte Funktionen
- `@private` für interne Helfer
- Kurze prägnante Erstbeschreibung (kein doppelter Funktionsname)
- Globale Inline-Handler nur falls zwingend nötig

## 🗄️ Realtime Database Provisioning (bereits aktiv)

Beim ersten erfolgreichen Login eines echten Firebase-Nutzers (kein Gast) legt `userProvisioning.js` automatisch zwei Knoten in der Realtime Database an:

```
users/<uid>     # Stammdaten (email, displayName, provider, status, timestamps)
contacts/<uid>  # Eigene Kontakt-Basis (initials, Farbe, name)
```

Derzeit gibt es noch KEIN volles CRUD für mehrere Kontakte – diese Struktur ist die Grundlage für spätere Erweiterungen.

## 📜 Skripte

```bash
npm run docs        # Generiert HTML nach ./documentation
npm run docs-serve  # Generiert & startet lokalen Server (Port siehe Ausgabe)
```

## 🔁 Empfohlener Workflow

1. Feature umsetzen
2. Öffentliche API kommentieren (JSDoc)
3. `npm run docs` ausführen & prüfen
4. Commit & Push

## ⚙️ Automatisierung (optional)

Pre-Commit Hook (derzeit nicht aktiv):

```bash
npm i -D husky
npx husky install
echo "npm run docs" > .husky/pre-commit
chmod +x .husky/pre-commit
```

> Nicht aktiviert, um schnelle Commits während aktiver Implementierung zu ermöglichen.

## 🧩 Technische Eckpunkte

| Bereich        | Beschreibung                                             |
| -------------- | -------------------------------------------------------- |
| Architektur    | Multi Page Application + modulare ES Modules             |
| Layout         | Header & Sidebar als HTML-Templates (Lazy Loading)       |
| Auth           | Firebase Authentication (E-Mail/Passwort + Gast Session) |
| Provisioning   | Realtime DB: users/<uid>, contacts/<uid> (Basis)         |
| Guarding       | `pageGuard.ensureAuthenticated()` auf geschützten Seiten |
| UI Komponenten | Summary, Board, Add Task, Contacts, Profile, Settings    |
| Erweiterbar    | Persistente Tasks & Kontakt-CRUD, Firestore optional     |
| Modale & Icons | Dynamische SVG-Icon-Integration, Input-Icons, Kontakt-Modale |

## 🖥️ Browser-Unterstützung

Getestet / Zielumgebung:


Modale und SVG-Icons sind in allen Zielbrowsern getestet und funktionieren konsistent.

## ✅ Code- & Stil-Richtlinien

- Funktionen möglichst < ~14 Zeilen (Single Responsibility)
- Dateien überschaubar (< ~400 Zeilen)
- Benennung: `camelCase`
- Keine ungefangenen Errors in der Konsole
- XSS-Vermeidung bei dynamischer Ausgabe (z.B. `escapeHtml` im Header)

## 📱 Responsives Verhalten

- Läuft ab 320px Breite ohne horizontales Scrollen
- Max-Width Begrenzung für große Screens
- Touch-taugliche Interaktionen vorgesehen

## 🔑 Firebase Setup (Auth + Realtime Database Basis)

1. Projekt in der Firebase Console anlegen
2. Authentication aktivieren (E-Mail/Passwort)
3. Config in `js/common/firebase.js` eintragen

```javascript
const firebaseConfig = {
  apiKey: "<KEY>",
  authDomain: "<PROJECT>.firebaseapp.com",
  projectId: "<PROJECT-ID>",
  // ... weitere Werte
};
```

## 🚀 Deployment (statisch möglich)

- Netlify (Drag & Drop oder Git)
- Vercel (Git Push Deploy)
- GitHub Pages
- Firebase Hosting (`firebase deploy`)

MPA → Kein spezielles SPA Rewriting nötig.

## 🧪 Manuelle Tests (aktuelle Basis-Checkliste)

- [ ] Login + Logout + Gastmodus (index.html ↔ summary.html)
- [ ] Fehlerbehandlung bei falschen Credentials
- [ ] Auth-Guard leitet ungeloggte Nutzer von internen Seiten zurück zur Startseite
- [ ] Template-Loader injiziert Header & Sidebar ohne Race Conditions
- [ ] Responsive Layout < 400px & > 1200px auf allen Seiten
- [ ] Tastaturbedienung Profilmenü
- [ ] Provisioning legt users/<uid> & contacts/<uid> an
- [ ] Dokumentation baut ohne Warnungen

## ⚖️ Rechtliches

- Datenschutzerklärung (Privacy Policy) Seite (geplant / falls erforderlich)
- Impressum (Legal Notice) Seite (geplant / falls erforderlich)

## 👥 Zusammenarbeit

- Sinnvolle Commit Messages
- Kleine, klar abgegrenzte Changes
- Optional: Branch pro Feature (später CI Hook denkbar)

---

## 📌 Roadmap (Kurz)

- Kontakt-CRUD (mehrere Einträge pro User)
- Task-Persistenz (DB statt nur lokal / Platzhalter)
- Zugriffsregeln (Security Rules Harden)
- Board Drag & Drop Persistenz
- Optional: Firestore / Offline / PWA

---

**Built with ❤️ using Vanilla JavaScript & Firebase**
