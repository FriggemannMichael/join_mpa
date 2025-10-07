# Join - Projektstruktur

_Aktualisiert: 2025-10-03_  
_Architektur: Multi Page Application (MPA) mit wiederverwendbaren Layout-Partials_

## 📁 Verzeichnisstruktur (Ist-Zustand)

```
join/
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
├── css/                       # Styles (Tokens, Layout, Seiten)
├── img/                       # Icons, Grafiken, Schriftarten
│   ├── icon/
│   └── fonts/
├── js/
│   ├── common/                # Shared Utilities & Services
│   │   ├── firebase.js
│   │   ├── session.js
│   │   ├── authService.js
│   │   ├── userProvisioning.js
│   │   ├── pageGuard.js
│   │   ├── layout.js
│   │   ├── templateLoader.js
│   │   └── errorMap.js
│   └── pages/                 # Seiten-spezifische Controller
│       ├── login.js
│       ├── signup.js
│       ├── summary.js
│       ├── board.js
│       ├── add-task.js
│       ├── contacts.js
│       ├── privacy.js
│       ├── legal.js
│       ├── profile.js
│       └── settings.js
├── templates/                 # HTML-Teile für Header & Sidebar
│   ├── header.html
│   └── sidebar.html
├── documentation/             # Generierte JSDoc HTML Files
├── migration/                 # Datenmigrationen / Skripte
└── olddata/                   # Altbestand (SPA-Ära)
```

## 🏗️ Architektur-Prinzipien

### Mehrseitiges Layout mit Partials

- Jede Route besitzt ein eigenes HTML-Dokument mit minimalem Inline-Markup.
- Gemeinsame Layout-Elemente (Header, Sidebar) werden über `templates/*.html` geladen.
- `js/common/templateLoader.js` cached und injiziert Partials asynchron.
- `js/common/layout.js` übernimmt das Bootstrapping der Shell (Header/Sidebar) je Seite.
- Authentifizierte Seiten schützen sich via `pageGuard.js` und Session-Prüfung.

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

- `css/root.css`: Design Tokens (Farben, Typography, Spacing).
- `css/main.css`: Layout-Frame für Header, Sidebar, Content (auch eigenständige Seiten).
- `css/add_task.css`, `css/board.css`, `css/contact.css`, … : Spezialstile pro Feature.
- Responsive Verhalten bleibt Mobile-First, kompatibel mit früherer SPA.

## 💻 JavaScript-Module (Kurzüberblick)

| Bereich        | Datei / Ordner                  | Zweck                                  |
| -------------- | ------------------------------- | -------------------------------------- |
| Firebase Setup | `js/common/firebase.js`         | Initialisierung (Auth + DB Config)     |
| Session Layer  | `js/common/session.js`          | Speicherung & Löschung aktiver Sitzung |
| Auth Service   | `js/common/authService.js`      | Login/Signup/Gast + Fehlerbehandlung   |
| Provisioning   | `js/common/userProvisioning.js` | Anlage `users/<uid>`, `contacts/<uid>` |
| Layout         | `js/common/layout.js`           | Template Injection, Navigation Binding |
| Guard          | `js/common/pageGuard.js`        | Redirect bei fehlender Auth            |
| Pages          | `js/pages/*.js`                 | Controller & UI-Logik je Dokument      |

## 🔄 Datenfluss & State Management

- `firebase.auth().onAuthStateChanged` triggert Session-Sync in `session.js`.
- Seiten schützen sich beim Laden über `pageGuard.ensureAuthenticated()`.
- `layout.bootShell()` injiziert Header & Sidebar und verbindet Logout/Avatar-Menüs.
- Nutzeranlagen geschehen on-demand im Hintergrund (`userProvisioning.ensureUserBootstrap`).

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

- Statisches Hosting ausreichend (Netlify, Vercel, GitHub Pages, Firebase Hosting).
- Keine Hash-Rewrites mehr nötig – jede Seite existiert physisch.
- Prüfliste aktualisiert (siehe README): Login-Fluss, Guard-Redirects, Template-Laden, Responsive Layout.

## 🗺️ Legacy & Migration

- `olddata/` und `migration/` bleiben unverändert für Dokumentationszwecke.
- Schrittweise Bereinigung (z. B. alte Assets) erfolgt nach Prüfung der Berechtigungen.

---

_Diese Struktur spiegelt den aktuellen Stand der MPA-Umstellung wider. Weitere Aufräumarbeiten (Legacy-Code entfernen, Dokumentation angleichen) folgen iterativ._
?
