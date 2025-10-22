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
│   │   ├── svg-template.js         # Zentrale SVG-Icon-Sammlung (dynamisch)
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

| Bereich        | Datei / Ordner                  | Zweck                                             |
| -------------- | ------------------------------- | ------------------------------------------------- |
| Firebase Setup | `js/common/firebase.js`         | Initialisierung (Auth + DB Config)                |
| Session Layer  | `js/common/session.js`          | Speicherung & Löschung aktiver Sitzung            |
| Auth Service   | `js/common/authService.js`      | Login/Signup/Gast + Fehlerbehandlung              |
| Provisioning   | `js/common/userProvisioning.js` | Anlage `users/<uid>`, `contacts/<uid>`            |
| Layout         | `js/common/layout.js`           | Template Injection, Navigation Binding            |
| Guard          | `js/common/pageGuard.js`        | Redirect bei fehlender Auth                       |
| Pages          | `js/pages/*.js`                 | Controller & UI-Logik je Dokument                 |
| SVG-Icons      | `js/common/svg-template.js`     | Zentrale SVG-Icon-Sammlung, dynamische Einbindung |

## 🔄 Datenfluss & State Management

- Input-Icons und Button-Icons werden nach dem Laden der Modale per JS aus `svg-template.js` gesetzt (z. B. `document.getElementById('contactSaveIcon').innerHTML = icons.checkwhite`).

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

- Modale und SVG-Icon-Integration sind für alle gängigen Browser getestet.

## 🗺️ Legacy & Migration

- `olddata/` und `migration/` bleiben unverändert für Dokumentationszwecke.
- Schrittweise Bereinigung (z. B. alte Assets) erfolgt nach Prüfung der Berechtigungen.

---

Diese Struktur spiegelt den aktuellen Stand der MPA-Umstellung wider. Modale, SVG-Icons und Input-Icons sind vollständig integriert und dokumentiert. Weitere Aufräumarbeiten (Legacy-Code entfernen, Dokumentation angleichen) folgen iterativ.
?
