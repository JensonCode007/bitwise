# Bitwise

Bitwise is a desktop collaborative codespace built with **Electron**, **React**, and **TypeScript**.  
It provides a modern editor experience powered by Monaco, real‑time collaboration via Yjs, and a connected backend for session management and persistence.

---

## Features

- 🧠 **Electron + React + TypeScript**
  - Cross‑platform desktop app using Electron and Vite.
  - Strongly typed React UI in TypeScript.

- ✍️ **Monaco Editor Integration**
  - VS Code–like editing experience via `@monaco-editor/react`.
  - Syntax highlighting and rich editing for multiple languages.

- 👥 **Real‑time Collaboration**
  - Shared editing powered by **Yjs**, `y-monaco`, and `y-websocket`.
  - WebSocket + Socket.IO based signaling for syncing clients.

- 🗄️ **Backend Service**
  - Separate Node/TypeScript backend (`src/backend`) for:
    - Session / workspace management.
    - WebSocket communication.
    - Data persistence via **better-sqlite3**.

- 🎨 **Modern UI**
  - Tailwind CSS and `tailwind-merge` for styling.
  - Icon set via `lucide-react`.

- 🧪 **Type‑safe & Linted**
  - Unified ESLint + Prettier setup.
  - Web and Node type‑checking scripts.

---

## Tech Stack

### Desktop App

- **Runtime:** Electron
- **Frontend:** React, TypeScript
- **Bundler/Dev Server:** Vite (`electron-vite`)
- **Editor:** Monaco (`@monaco-editor/react`)
- **Styling:** Tailwind CSS

### Collaboration & Realtime

- **CRDT:** Yjs
- **Editor Binding:** `y-monaco`
- **Transport:** `y-websocket`, `socket.io-client`, `ws`

### Backend (`src/backend`)

- **Runtime:** Node.js + TypeScript
- **Web Framework:** Express
- **Security & Middleware:** Helmet, CORS, Morgan
- **Persistence:** SQLite via `better-sqlite3`
- **Realtime:** Socket.IO, WebSocket (`ws`)
- **Env & Tooling:** dotenv, tsx

---

## Getting Started

### Prerequisites

- **Node.js** (LTS recommended)
- **npm** (included with Node)

> The project uses npm and includes a `package-lock.json`.

### 1. Clone the Repository

```bash
git clone https://github.com/JensonCode007/bitwise.git
cd bitwise
```

### 2. Install Dependencies

This installs Electron + frontend dependencies and prepares native modules.

```bash
npm install
```

### 3. Run in Development

Start the Electron app with hot reloading:

```bash
npm run dev
```

This will:

- Start the Electron main & renderer processes via `electron-vite dev`.
- Open the Bitwise desktop app window.

### 4. Start the Backend (if used separately)

The backend code lives under `src/backend` and has its own `package.json`.

```bash
cd src/backend
npm install
npm run dev
```

Common backend scripts:

- `npm run dev` – Start backend with live reload using `tsx`.
- `npm run build` – Compile TypeScript to `dist`.
- `npm start` – Run compiled backend from `dist/index.js`.
- `npm run db:reset` – Run DB reset script at `src/db/reset.ts`.

You may want to run the backend alongside the Electron app during development.

---

## Scripts (Root Project)

All scripts below are defined in the root `package.json`:

```bash
# Format code with Prettier
npm run format

# Lint with ESLint
npm run lint

# Type-check Node and web targets
npm run typecheck
npm run typecheck:node
npm run typecheck:web

# Start Electron app in dev mode
npm run dev

# Preview build in Electron
npm start

# Production build (Electron + typecheck)
npm run build
```

### Packaging / Distribution

Electron builds are handled by `electron-builder`:

```bash
# Build app and unpacked directory
npm run build:unpack

# Windows installer / artifacts
npm run build:win

# macOS build
npm run build:mac

# Linux build
npm run build:linux
```

These commands use `electron-builder.yml` and the `build` directory for configuration and output.

---

## Project Structure

High‑level layout of the repo:

```text
bitwise/
├─ build/                 # Build artifacts / electron-builder output (ignored in git)
├─ resources/             # Static resources (icons, assets, etc.)
├─ src/
│  ├─ backend/            # Backend Node/TypeScript service (Express + WebSocket)
│  └─ ...                 # Electron main/renderer source, React UI, editor integration
├─ electron.vite.config.ts
├─ electron-builder.yml
├─ tsconfig*.json         # Shared TS config for node/web
├─ package.json           # Electron + frontend app
├─ LICENSE                # GPL-3.0 license
└─ README.md
```

---

## Development Notes

- **TypeScript configs**
  - `tsconfig.node.json` – Node/Electron main process.
  - `tsconfig.web.json` – Renderer/React code.
- **Formatting & Linting**
  - Prettier config in `.prettierrc.yaml`.
  - ESLint config in `eslint.config.mjs`.
- **Native Dependencies**
  - `node-pty`, `better-sqlite3`, and Electron itself may require native build tools depending on OS (e.g., build-essential on Linux, Xcode tools on macOS, or Visual Studio Build Tools on Windows).

---

## License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.  
See [`LICENSE`](./LICENSE) for details.

If you fork or redistribute Bitwise, make sure your usage complies with the GPL-3.0 terms.

---

## Acknowledgements

- Original project: [`harryfrzz/bitwise`](https://github.com/harryfrzz/bitwise)
- Built on:
  - [Electron](https://www.electronjs.org/)
  - [React](https://react.dev/)
  - [Vite](https://vitejs.dev/)
  - [Yjs](https://yjs.dev/)
  - [Monaco Editor](https://microsoft.github.io/monaco-editor/)
