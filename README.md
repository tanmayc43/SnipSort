# SnipSort

SnipSort is a modern code snippet manager for developers, designed to help you store, organize, and share code snippets with features like full-text search, syntax highlighting, team collaboration, and version control.

---

## Features

- 🚀 **Monaco Editor Integration**: Beautiful syntax highlighting for 25+ languages.
- 🗂️ **Smart Organization**: Organize snippets with folders, tags, and projects.
- 👥 **Team Collaboration**: Share and collaborate on snippets with your team.
- 🔍 **Powerful Search**: Instantly find snippets by code, title, or tags.
- ⭐ **Favorites & Bookmarks**: Mark important snippets for quick access.
- 🕒 **Version Control**: Track changes, view edit history, and restore previous versions of your snippets.
- 🌗 **Light/Dark Mode**: Theme-aware UI for comfortable coding.
- 🔒 **Authentication**: Secure login/signup, with optional Google OAuth.

---

## Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (with Supabase for migrations)
- **Authentication**: JWT, Passport.js (with Google OAuth option)

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL

### 1. Clone the Repository
```bash
git clone https://github.com/tanmayc43/snipsort.git
cd snipsort
```

### 2. Install Dependencies
```bash
# Frontend
npm install
cd client && npm install

# Backend
cd ../server && npm install
```

### 3. Configure Environment Variables
- Copy `.env.example` to `.env` in both `client/` and `server/` directories and fill in the required values (database URL, JWT secret, etc).

### 4. Set Up the Database
- Ensure PostgreSQL is running.
- Run the migrations in `supabase/migrations/schema.sql` to set up tables.

### 5. Start the App
```bash
# In one terminal (backend)
cd server
npm start

# In another terminal (frontend)
cd client
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173) and the backend at [http://localhost:3000](http://localhost:3000).

---

## Usage

- **Sign up** and create your first snippet.
- **Organize** snippets into folders and projects.
- **Search** for snippets using keywords or tags.
- **Edit** a snippet to automatically create a new version.
- **View Version History**: Open a snippet and click "Version History" to see all previous versions, compare changes, and restore any version.
- **Collaborate** by inviting team members to shared projects.

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

