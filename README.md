# Join - Kanban Project Management Tool

A lightweight Kanban / Task and Contact Management Tool built with Vanilla JavaScript (ES Modules) and Firebase Authentication.

## 🎯 Project Overview

Current state: **Multi Page Application (MPA)** with dedicated HTML documents per area. Public pages (`index.html`, `signup.html`, `privacy.html`, `legal.html`) are available without authentication. Authenticated pages (`summary.html`, `board.html`, `add-task.html`, `contacts.html`, `profile.html`, `settings.html`) are protected on load via a shared auth guard. Header and sidebar are delivered as templates and dynamically included per page.

### Modals & SVG Icon Integration

- **Contact Modals**: Dedicated modals are used for creating and editing contacts (`contacts.html`).
- **Input Icons**: All relevant input fields (Name, Email, Phone) have an icon on the right (`<span class="input__icon--right">`), which is set via JS from `svg-template.js`.
- **SVG Icons**: Icons are managed centrally in `js/common/svg-template.js` as string objects and dynamically injected via `innerHTML` into the respective `<span>` or button elements.
- **Button Icons**: Save/Create buttons in modals use SVG icons (e.g. `checkwhite`), which are always set in the desired color (e.g. white) via JS. CSS hover effects are specifically overridden to fix the color.

## 📁 Project Structure (Current State)

```
join/
├── index.html                 # Login / Landing (public)
├── signup.html                # Registration (public)
├── summary.html               # Dashboard (authenticated)
├── board.html                 # Kanban Board (authenticated)
├── add-task.html              # Task Form (authenticated)
├── contacts.html              # Contacts (authenticated)
├── profile.html               # Profile (authenticated)
├── settings.html              # Settings (authenticated)
├── privacy.html               # Privacy Policy (public)
├── legal.html                 # Legal Notice (public)
├── css/
│   ├── root.css               # Design Tokens / Reset
│   ├── main.css               # Layout / Navigation / Standalone Pages
│   └── *.css                  # Feature-specific Styles (Contacts, Board, …)
│   ├── modal.css             # Modals for contacts, incl. icon positioning
├── img/
│   ├── icon/                  # SVGs & PNGs
│   └── fonts/                 # Font files (Inter)
├── js/
│   ├── common/                # Shared Utilities & Services (Firebase, Auth, Layout)
│   │   ├── svg-template.js   # Central SVG icon collection (dynamic)
│   └── pages/                 # Page-specific controllers (login, summary, …)
├── templates/
│   ├── header.html            # Partials for layout shell
│   └── sidebar.html
├── documentation/             # Generated JSDoc files (output)
├── migration/                 # Migration scripts / data transfers
├── olddata/                   # Legacy data (static / pre-refactor)
├── package.json
├── STRUCTURE.md
└── README.md
```

> Planned additional persistence (Tasks, multiple contacts) follows after stabilization of auth / provisioning flow.

## 🧾 JSDoc Conventions

- `@module` per central file (main, auth, firebase, header, sidebar, summary)
- `@function`, `@param`, `@returns` for exported functions
- `@private` for internal helpers
- Short, concise first description (no duplicate function name)
- Global inline handlers only if absolutely necessary

## 🗄️ Realtime Database Provisioning (already active)

On the first successful login of a real Firebase user (not a guest), `userProvisioning.js` automatically creates two nodes in the Realtime Database:

```
users/<uid>     # Master data (email, displayName, provider, status, timestamps)
contacts/<uid>  # Own contact base (initials, color, name)
```

Currently, there is NO full CRUD for multiple contacts – this structure is the foundation for later extensions.

## 📜 Scripts

```bash
npm run docs        # Generates HTML to ./documentation
npm run docs-serve  # Generates & starts local server (see output for port)
```

## 🔁 Recommended Workflow

1. Implement feature
2. Comment public API (JSDoc)
3. Run `npm run docs` & check
4. Commit & Push

## ⚙️ Automation (optional)

Pre-Commit Hook (currently not active):

```bash
npm i -D husky
npx husky install
echo "npm run docs" > .husky/pre-commit
chmod +x .husky/pre-commit
```

> Not activated to enable quick commits during active implementation.

## 🧩 Technical Key Points

| Area           | Description                                              |
| -------------- | -------------------------------------------------------- |
| Architecture   | Multi Page Application + modular ES Modules              |
| Layout         | Header & Sidebar as HTML templates (Lazy Loading)        |
| Auth           | Firebase Authentication (Email/Password + Guest Session) |
| Provisioning   | Realtime DB: users/<uid>, contacts/<uid> (Base)          |
| Guarding       | `pageGuard.ensureAuthenticated()` on protected pages     |
| UI Components  | Summary, Board, Add Task, Contacts, Profile, Settings   |
| Extensible     | Persistent Tasks & Contact CRUD, Firestore optional      |
| Modals & Icons | Dynamic SVG icon integration, Input icons, Contact modals |

## 🖥️ Browser Support

Tested / Target environment:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Modals and SVG icons are tested and work consistently in all target browsers.

## ✅ Code & Style Guidelines

- Functions preferably < ~14 lines (Single Responsibility)
- Files manageable (< ~400 lines)
- Naming: `camelCase`
- No uncaught errors in console
- XSS avoidance with dynamic output (e.g. `escapeHtml` in header)

## 📱 Responsive Behavior

- Runs from 320px width without horizontal scrolling
- Max-width limit for large screens
- Touch-friendly interactions provided

## 🔑 Firebase Setup (Auth + Realtime Database Base)

1. Create project in Firebase Console
2. Activate Authentication (Email/Password)
3. Enter config in `js/common/firebase.js`

```javascript
const firebaseConfig = {
  apiKey: "<KEY>",
  authDomain: "<PROJECT>.firebaseapp.com",
  projectId: "<PROJECT-ID>",
  // ... more values
};
```

## 🚀 Deployment (static possible)

- Netlify (Drag & Drop or Git)
- Vercel (Git Push Deploy)
- GitHub Pages
- Firebase Hosting (`firebase deploy`)

MPA → No special SPA rewriting needed.

## 🧪 Manual Tests (current base checklist)

- [ ] Login + Logout + Guest mode (index.html ↔ summary.html)
- [ ] Error handling for wrong credentials
- [ ] Auth guard redirects unauthenticated users from internal pages back to start page
- [ ] Template loader injects header & sidebar without race conditions
- [ ] Responsive layout < 400px & > 1200px on all pages
- [ ] Keyboard operation profile menu
- [ ] Provisioning creates users/<uid> & contacts/<uid>
- [ ] Documentation builds without warnings

## ⚖️ Legal

- Privacy Policy page (planned / if required)
- Legal Notice page (planned / if required)

## 👥 Collaboration

- Meaningful commit messages
- Small, clearly defined changes
- Optional: Branch per feature (CI hook conceivable later)

---

## 📌 Roadmap (Short)

- Contact CRUD (multiple entries per user)
- Task persistence (DB instead of just local / placeholder)
- Access rules (Security Rules Hardening)
- Board Drag & Drop persistence
- Optional: Firestore / Offline / PWA

---

**Built with ❤️ using Vanilla JavaScript & Firebase**
