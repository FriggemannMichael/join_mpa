# Join - Projektstruktur

_Aktualisiert: 2025-11-03_  
_Architektur: Multi Page Application (MPA) mit wiederverwendbaren Layout-Partials_

## 📁 Verzeichnisstruktur (Ist-Zustand)

```
join_mpa/
├── index.html                 # Login + Einstieg (öffentlich)
├── signup.html                # Registrierung (öffentlich)
├── summary.html               # Dashboard (authentifiziert)
├── board.html                 # Kanban Board (authentifiziert)
├── add-task.html              # Task-Formular (authentifiziert)
├── contacts.html              # Kontakte (authentifiziert)
├── privacy.html               # Datenschutz (öffentlich)
├── legal.html                 # Impressum (öffentlich)
├── profile.html               # Profil (authentifiziert)
├── settings.html              # Einstellungen (authentifiziert)
├── README.md                  # Projektdokumentation
├── STRUCTURE.md               # Diese Datei
├── package.json               # NPM Scripts + Meta
├── jsdoc.json                 # JSDoc Konfiguration
├── firebase-rules-guest-access.json  # Firebase Security Rules
├── FIREBASE_RULES_GUEST.md    # Doku: Guest-Zugriff auf Firebase
├── .github/
│   └── copilot-instructions.md  # Copilot Code-Richtlinien
├── assets/                    # Bilder, Icons, Schriftarten
│   ├── fonts/
│   │   └── Inter/
│   ├── icons/
│   ├── images/
│   └── olddata/              # Legacy-Daten
├── css/                       # Styles (Tokens, Layout, Seiten)
│   ├── root.css              # CSS-Variablen
│   ├── main.css              # Globale Styles
│   ├── animations.css        # Animationen
│   ├── responsive-global.css # Responsive Breakpoints
│   ├── modal.css             # Modal-Styles
│   ├── auth.css              # Login/Signup Styles
│   ├── board.css             # Board-Styles
│   ├── add_task.css          # Task-Formular Styles
│   ├── contact.css           # Kontakte Styles
│   ├── summary.css           # Dashboard Styles
│   └── board/                # Board-spezifische Styles
│       ├── assignees.css
│       ├── boardModal.css
│       ├── subtask.css
│       └── taskCard.css
├── js/
│   ├── common/                # Shared Utilities & Services
│   │   ├── firebase.js       # Firebase-Konfiguration
│   │   ├── session.js        # Guest- & User-Session-Management
│   │   ├── authService.js    # Login/Signup/Logout
│   │   ├── userProvisioning.js  # User-Erstellung in DB
│   │   ├── pageGuard.js      # Auth-Schutz für Seiten
│   │   ├── layout.js         # Template-Injection (Header/Sidebar)
│   │   ├── templateLoader.js # HTML-Partial-Loader
│   │   ├── errorMap.js       # Firebase-Error-Mapping
│   │   ├── svg-template.js   # SVG-Icon-Sammlung
│   │   ├── database.js       # Firebase DB-Wrapper
│   │   ├── tasks.js          # Task-Service (CRUD)
│   │   └── splashScreen.js   # Intro-Animation
│   ├── pages/                 # Seiten-spezifische Controller
│   │   ├── login.js          # Login-Seite
│   │   ├── signup.js         # Registrierungs-Seite
│   │   ├── summary.js        # Dashboard-Seite
│   │   ├── contacts.js       # Kontakte-Seite
│   │   ├── privacy.js        # Datenschutz-Seite
│   │   ├── legal.js          # Impressum-Seite
│   │   ├── profile.js        # Profil-Seite
│   │   ├── settings.js       # Einstellungen-Seite
│   │   ├── add-task.js       # Task-Formular (Hauptlogik)
│   │   ├── add-task-form.js  # Formular-Handling
│   │   ├── add-task-assignees.js  # Assignee-Auswahl
│   │   ├── add-task-assignees-ui.js  # Assignee-UI
│   │   └── add-task-subtasks.js  # Subtask-Verwaltung
│   └── board/                 # Board-Modul (modular)
│       ├── index.js          # Board-Hauptlogik
│       ├── utils.js          # Board-Hilfsfunktionen
│       ├── components/       # UI-Komponenten
│       │   ├── assignees.js
│       │   └── ...
│       ├── dnd/              # Drag & Drop
│       ├── features/         # Board-Features
│       ├── handlers/         # Event-Handler
│       ├── modals/           # Board-Modale
│       ├── services/         # Board-Services
│       ├── state/            # State-Management
│       └── templates/        # HTML-Templates
├── templates/                 # HTML-Partials für Layout
│   ├── header.html
│   └── sidebar.html
├── documentation/             # Generierte JSDoc HTML-Dokumentation
├── migration/                 # Datenmigrationen / Skripte
│   ├── migrateUsers.mjs      # User-Migration
│   └── MIGRATION.md          # Migrations-Doku
└── scripts/                   # Utility-Skripte
    ├── seedDemoData.mjs      # Demo-Daten-Generator
    ├── README.md             # Skript-Dokumentation
    └── output/               # Generierte JSON-Exports
```

## 🏗️ Architektur-Prinzipien

### Mehrseitiges Layout mit Partials

- **MPA-Ansatz**: Jede Hauptansicht ist eine eigene HTML-Datei mit dediziertem Controller.
- **Wiederverwendbare Partials**: Header und Sidebar werden dynamisch in jede Seite geladen (`js/common/templateLoader.js`).
- **Page Guards**: Authentifizierungs-Schutz per `js/common/pageGuard.js` (Redirect zu `index.html` bei fehlender Auth).
- **Guest-Modus**: Unauthentifizierte Benutzer können als "Guest" auf Board und Kontakte zugreifen (nur Lesezugriff).

### Modale & SVG-Icon-Integration

- **Kontakt-Modale**: Sowohl für das Erstellen als auch Bearbeiten von Kontakten werden eigene Modale verwendet (`contacts.html`).
- **Input-Icons**: Alle relevanten Input-Felder (Name, Email, Telefon) besitzen rechts ein Icon (`<span class="input__icon--right">`), das per JS aus `svg-template.js` gesetzt wird.
- **SVG-Icons**: Die Icons werden zentral in `js/common/svg-template.js` als String-Objekte verwaltet und dynamisch per `innerHTML` in die jeweiligen `<span>`- oder Button-Elemente eingefügt.
- **Button-Icons**: Die Save-/Create-Buttons in den Modalen nutzen SVG-Icons (z. B. `checkwhite`), die immer in der gewünschten Farbe (z. B. weiß) per JS gesetzt werden. CSS-Hover-Effekte werden gezielt überschrieben, um die Farbe zu fixieren.

### Code-Organisation

- **Shared Layer (`js/common/`)**: Firebase Setup, Session-Handling, Auth-Service, Error-Mapping.
- **Page Layer (`js/pages/`)**: Pro Seite ein schlanker Controller (Event-Bindings, Datenzugriffe).
- **Templates (`templates/`)**: Reine HTML-Snippets ohne Skripte, werden nach dem Laden dekoriert.
- Historische SPA-Skripte wurden entfernt; Referenzmaterial liegt nur noch unter `olddata/`.

## 🌐 Seiten & Zugriff

| Seite           | Controller             | Zweck                 | Zugriff         |
| --------------- | ---------------------- | --------------------- | --------------- |
| `index.html`    | `js/pages/login.js`    | Login, Gast, Redirect | Öffentlich      |
| `signup.html`   | `js/pages/signup.js`   | Registrierung         | Öffentlich      |
| `summary.html`  | `js/pages/summary.js`  | Dashboard             | Authentifiziert |
| `board.html`    | `js/pages/board.js`    | Kanban Board          | Authentifiziert |
| `add-task.html` | `js/pages/add-task.js` | Task-Erstellung       | Authentifiziert |
| `contacts.html` | `js/pages/contacts.js` | Kontakte              | Authentifiziert |
| `profile.html`  | `js/pages/profile.js`  | Benutzerprofil        | Authentifiziert |
| `settings.html` | `js/pages/settings.js` | Einstellungen         | Authentifiziert |
| `privacy.html`  | `js/pages/privacy.js`  | Datenschutzerklärung  | Öffentlich      |
| `legal.html`    | `js/pages/legal.js`    | Impressum             | Öffentlich      |

## 🎨 CSS-Architektur

- `css/add_task.css`, `css/board.css`, `css/contact.css`, … : Spezialstile pro Feature.
- `css/modal.css`: Modale für Kontakt-Erstellung und -Bearbeitung, inkl. responsive Design und Icon-Positionierung.

## 💻 JavaScript-Module (Kurzüberblick)

| Bereich           | Datei / Ordner                  | Zweck                                                      |
| ----------------- | ------------------------------- | ---------------------------------------------------------- |
| Firebase Setup    | `js/common/firebase.js`         | Initialisierung (Auth + DB Config)                         |
| Session Layer     | `js/common/session.js`          | Guest- & User-Session-Management (sessionStorage)          |
| Auth Service      | `js/common/authService.js`      | Login/Signup/Logout + Fehlerbehandlung                     |
| Provisioning      | `js/common/userProvisioning.js` | Anlage `users/<uid>`, `contacts/<uid>` in Firebase         |
| Layout            | `js/common/layout.js`           | Template Injection (Header/Sidebar), Navigation Binding    |
| Guard             | `js/common/pageGuard.js`        | Redirect bei fehlender Auth (außer Guest-Modus)            |
| Database          | `js/common/database.js`         | Firebase Realtime Database Wrapper                         |
| Tasks Service     | `js/common/tasks.js`            | Task-CRUD-Operationen (subscribeToTasks, createTask, etc.) |
| Pages             | `js/pages/*.js`                 | Controller & UI-Logik je Dokument                          |
| Board Module      | `js/board/**/*.js`              | Modulares Board-System (DnD, Modals, State)                |
| SVG-Icons         | `js/common/svg-template.js`     | Zentrale SVG-Icon-Sammlung, dynamische Einbindung          |
| Splash Screen     | `js/common/splashScreen.js`     | Intro-Animation beim Login                                 |
| Error Mapping     | `js/common/errorMap.js`         | Firebase-Error-Code zu Benutzer-Nachricht                  |
| Demo Data Scripts | `scripts/seedDemoData.mjs`      | Node.js-Skript zur Generierung von Demo-Daten (JSON)       |

## 🔄 Datenfluss & State Management

### Firebase Realtime Database

- **Struktur**: `/tasks/{taskId}`, `/contacts/{uid}`, `/users/{uid}`
- **Authentifizierung**: Firebase Auth für registrierte User, Guest-Session für unauthentifizierte User
- **Security Rules**: 
  - **Lese-Zugriff**: Öffentlich für `/tasks` und `/contacts` (auch Guest kann lesen)
  - **Schreib-Zugriff**: Nur für authentifizierte User (`auth != null`)
  - Details siehe: `firebase-rules-guest-access.json` und `FIREBASE_RULES_GUEST.md`

### Session Management

- **Authenticated Users**: Firebase Auth Token + sessionStorage (`activeUser`)
- **Guest Users**: sessionStorage (`guestSession`) mit `{uid: "guest-user", displayName: "Guest User", email: "guest@example.com", provider: "guest"}`
- **Active User Getter**: `getActiveUser()` priorisiert Guest-Session, fällt zurück auf Firebase Auth

### UI State

- Input-Icons und Button-Icons werden nach dem Laden der Modale per JS aus `svg-template.js` gesetzt (z. B. `document.getElementById('contactSaveIcon').innerHTML = icons.checkwhite`).
- Board-State wird in `js/board/state/` verwaltet (z. B. aktuelle Tasks, Filter, Drag-Zustand).

## 📱 Responsive Breakpoints

```css
@media (min-width: 768px) {
  /* Tablet */
}
@media (min-width: 1024px) {
  /* Desktop */
}
@media (min-width: 1440px) {
  /* Large Desktop */
}
```

Die vorhandenen Styles wurden beibehalten; jede Seite lädt dieselben Stylesheets, sodass das responsive Verhalten konsistent bleibt.

## 🚀 Deployment-Bereitschaft

- **Browser-Support**: Chrome, Firefox, Safari, Edge (alle aktuellen Versionen)
- **Responsive Design**: 320px bis 1920px, kein horizontales Scrollen
- **Firebase Hosting**: Projekt ist bereit für Firebase Hosting-Deployment
- **JSDoc Dokumentation**: Vollständige Dokumentation aller Funktionen (siehe `documentation/`)
- **NPM Scripts**:
  - `npm run jsdoc`: Generiert JSDoc-Dokumentation
  - `npm run seed:demo`: Generiert Demo-Daten (JSON-Export)

## 🔐 Sicherheit & Zugriffskontrolle

### Firebase Security Rules

- **Aktuelle Rules**: `firebase-rules-guest-access.json`
- **Lese-Zugriff**: Öffentlich für `/tasks` und `/contacts` (auch Guest)
- **Schreib-Zugriff**: Nur für authentifizierte User
- **User-Daten**: Private User-Daten (`/users/{uid}`) nur für den jeweiligen User lesbar/schreibbar

### Guest-Modus

- **Zweck**: Demo-Zugang ohne Registrierung
- **Zugriff**: Nur Lesezugriff auf Tasks und Kontakte
- **Einschränkungen**: Kein Erstellen, Bearbeiten oder Löschen von Daten
- **Session**: Lokal in sessionStorage, kein Firebase Auth Token
- **Dokumentation**: Siehe `FIREBASE_RULES_GUEST.md`

## 🗺️ Legacy & Migration

- **`assets/olddata/`**: Legacy-Daten aus SPA-Ära (Referenz)
- **`migration/`**: User-Migrations-Skripte (`migrateUsers.mjs`) + Dokumentation
- **`scripts/`**: Utility-Skripte für Demo-Daten-Generierung

### Migrationen

- **User-Migration**: `migration/migrateUsers.mjs` - Migriert User-Daten zu Firebase
- **Demo-Daten**: `scripts/seedDemoData.mjs` - Generiert JSON-Exports für manuelle Firebase-Imports

## 📚 Dokumentation

- **JSDoc**: Automatisch generierte API-Dokumentation in `documentation/`
- **README.md**: Projekt-Übersicht, Setup-Anleitung, Features
- **STRUCTURE.md**: Diese Datei - Projekt-Architektur und Struktur
- **FIREBASE_RULES_GUEST.md**: Guest-Zugriff auf Firebase - Problem und Lösung
- **copilot-instructions.md**: Coding-Richtlinien für GitHub Copilot

## 🧪 NPM Scripts

| Script         | Befehl                 | Zweck                                     |
| -------------- | ---------------------- | ----------------------------------------- |
| `jsdoc`        | `npm run jsdoc`        | Generiert JSDoc-Dokumentation             |
| `seed:demo`    | `npm run seed:demo`    | Generiert Demo-Daten (JSON-Export)        |
| `start`        | (nicht definiert)      | Lokaler Dev-Server (z. B. Live Server)    |

---

Diese Struktur spiegelt den aktuellen Stand der MPA-Umstellung wider (Stand: 2025-11-03). Alle Features sind vollständig implementiert:
- ✅ JSDoc-Dokumentation (100% Coverage)
- ✅ Guest-Modus mit Firebase Security Rules
- ✅ Modulares Board-System
- ✅ Demo-Daten-Generator
- ✅ Responsive Design (320px - 1920px)
- ✅ Browser-Kompatibilität (Chrome, Firefox, Safari, Edge)
