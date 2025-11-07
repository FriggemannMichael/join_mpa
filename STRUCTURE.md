# Join - Project Structure

_Updated: 2025-11-07_  
_Architecture: Multi Page Application (MPA) with reusable layout partials_

## 📁 Directory Structure (Current State)

```
join/
├── index.html                 # Login + Entry (public)
├── signup.html                # Registration (public)
├── summary.html               # Dashboard (authenticated)
├── board.html                 # Kanban Board (authenticated)
├── add-task.html              # Task Form (authenticated)
├── contacts.html              # Contacts (authenticated)
├── privacy.html               # Privacy (public)
├── legal.html                 # Legal Notice (public)
├── profile.html               # Profile (authenticated)
├── settings.html              # Settings (authenticated)
├── README.md                  # Project documentation
├── STRUCTURE.md               # This file
├── package.json               # NPM Scripts + Meta
├── css/                       # Styles (Tokens, Layout, Pages)
├── img/                       # Icons, Graphics, Fonts
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
│   │   ├── svg-template.js         # Central SVG icon collection (dynamic)
│   └── pages/                 # Page-specific controllers
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
├── templates/                 # HTML parts for header & sidebar
│   ├── header.html
│   └── sidebar.html
├── documentation/             # Generated JSDoc HTML files
├── migration/                 # Data migrations / Scripts
└── olddata/                   # Legacy (SPA era)
```

## 🏗️ Architecture Principles

### Multi-page Layout with Partials

Each page is a standalone HTML document. Authenticated pages load header and sidebar dynamically via `templateLoader.js`. Layout components are injected once and then enhanced with event listeners (profile menu, logout, navigation highlighting).

### Modals & SVG Icon Integration

- **Contact Modals**: Dedicated modals are used for both creating and editing contacts (`contacts.html`).
- **Input Icons**: All relevant input fields (Name, Email, Phone) have an icon on the right (`<span class="input__icon--right">`), which is set via JS from `svg-template.js`.
- **SVG Icons**: Icons are managed centrally in `js/common/svg-template.js` as string objects and dynamically injected via `innerHTML` into the respective `<span>` or button elements.
- **Button Icons**: Save/Create buttons in modals use SVG icons (e.g. `checkwhite`), which are always set in the desired color (e.g. white) via JS. CSS hover effects are specifically overridden to fix the color.

### Code Organization

- **Shared Layer (`js/common/`)**: Firebase setup, session handling, auth service, error mapping.
- **Page Layer (`js/pages/`)**: One lean controller per page (event bindings, data access).
- **Templates (`templates/`)**: Pure HTML snippets without scripts, decorated after loading.
- Historical SPA scripts have been removed; reference material is only under `olddata/`.

## 🌐 Pages & Access

| Page            | Controller             | Purpose               | Access          |
| --------------- | ---------------------- | --------------------- | --------------- |
| `index.html`    | `js/pages/login.js`    | Login, Guest, Redirect | Public          |
| `signup.html`   | `js/pages/signup.js`   | Registration          | Public          |
| `summary.html`  | `js/pages/summary.js`  | Dashboard             | Authenticated   |
| `board.html`    | `js/pages/board.js`    | Kanban Board          | Authenticated   |
| `add-task.html` | `js/pages/add-task.js` | Task Creation         | Authenticated   |
| `contacts.html` | `js/pages/contacts.js` | Contacts              | Authenticated   |
| `profile.html`  | `js/pages/profile.js`  | User Profile          | Authenticated   |
| `settings.html` | `js/pages/settings.js` | Settings              | Authenticated   |
| `privacy.html`  | `js/pages/privacy.js`  | Privacy Policy        | Public          |
| `legal.html`    | `js/pages/legal.js`    | Legal Notice          | Public          |

## 🎨 CSS Architecture

- `css/root.css`: Design tokens (colors, spacing, z-index layers)
- `css/main.css`: Layout shell (header, sidebar, responsive breakpoints)
- `css/add_task.css`, `css/board.css`, `css/contact.css`, etc.: Feature-specific styles.
- `css/modal.css`: Modals for contact creation and editing, including responsive design and icon positioning.

## 💻 JavaScript Modules (Overview)

| Area           | File / Folder                   | Purpose                                               |
| -------------- | ------------------------------- | ----------------------------------------------------- |
| Firebase Setup | `js/common/firebase.js`         | Initialization (Auth + DB Config)                     |
| Session Layer  | `js/common/session.js`          | Storage & deletion of active session                  |
| Auth Service   | `js/common/authService.js`      | Login/Signup/Guest + error handling                   |
| Provisioning   | `js/common/userProvisioning.js` | Creation of `users/<uid>`, `contacts/<uid>`           |
| Layout         | `js/common/layout.js`           | Template injection, navigation binding                |
| Guard          | `js/common/pageGuard.js`        | Redirect if auth missing                              |
| Pages          | `js/pages/*.js`                 | Controller & UI logic per document                    |
| SVG Icons      | `js/common/svg-template.js`     | Central SVG icon collection, dynamic integration      |

## 🔄 Data Flow & State Management

- **Firebase Realtime Database** for users and contacts (currently basic provisioning).
- **Session Storage** for current user info (uid, email, displayName).
- **Page Controllers** read from session, call Firebase services, update DOM.
- No global state store; each page initializes independently.
- Input icons and button icons are set after modal loading via JS from `svg-template.js` (e.g. `document.getElementById('contactSaveIcon').innerHTML = icons.checkwhite`).

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

Existing styles have been retained; each page loads the same stylesheets so responsive behavior remains consistent.

## 🚀 Deployment Readiness

- All pages are static HTML + client-side JS (ES modules).
- No server-side rendering or build step required.
- Deploy directly to any static host (Netlify, Vercel, GitHub Pages, Firebase Hosting).
- Modals and SVG icon integration are tested for all common browsers.

## 🗺️ Legacy & Migration

- `olddata/` and `migration/` remain unchanged for documentation purposes.
- Gradual cleanup (e.g. old assets) occurs after permission verification.

---

This structure reflects the current state of the MPA conversion. Modals, SVG icons, and input icons are fully integrated and documented. Further cleanup (removing legacy code, aligning documentation) follows iteratively.
