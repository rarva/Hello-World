# Hello-World
Rhomberg OrgChart Admin - Multi-language authentication system with Supabase backend

Company colors: #DA162A (Dark Red), #EB8318 (Orange), #010101 (Black)

## Current Version: v1.0.0-auth-system

### Development Status: ✅ STABLE
Complete authentication and multi-language system implemented and tested.

---

## Features Implemented

### ✅ Authentication System
- Email/password signup with real-time database storage
- Email/password login with Supabase authentication
- Secure logout functionality
- Session persistence across page reloads and browser restarts
- Auto-redirect to home page if active session exists
- Specific error messages: "Email not found" vs "Wrong password"

### ✅ User Profiles & Data
- Supabase PostgreSQL `profiles` table with columns:
  - `id` (UUID, primary key)
  - `email` (text, unique)
  - `full_name` (text)
  - `language` (text - user's preferred language)
  - `created_at` (timestamp)
- User data synchronized between auth system and database

### ✅ Multi-Language Support (5 Languages)
- **Languages:** English (en), Portuguese (pt), German (de), French (fr), Italian (it)
- **Auto-detection:** Browser/system language detected on first visit → fallback to English
- **Persistence:** User's language preference saved to their profile in database
- **Smart loading:** Language loaded from user's profile after login (not from browser)
- **All UI text from strings.json** (Rule 1: No hardcoded English text)
- **Comprehensive translations:** 30+ UI strings × 5 languages

### ✅ User Experience
- **Remember Me:** Email auto-fills on return visits, checkbox pre-checked
- **Container architecture:** Persistent login/home/footer containers with smooth transitions
- **Auto-mode switch:** Form automatically switches to login after successful signup
- **Form validation:** No browser popups - custom translated error messages
- **Footer persistence:** Always stays at bottom during all transitions
- **Language switcher:** Available in login form for instant language change
- **Session persistence:** Close browser and come back - automatically logged in

### ✅ Code Quality
- **Rule 1 enforcement:** All visible UI text from translations
- **Rule 2 enforcement:** Manual commit control (never auto-commit)
- **COPILOT_GUIDE.txt:** Documented project rules and architecture
- **Modular structure:** Separate files for auth, footer, translations, styles
- **Comprehensive error handling:** Field-level validation + translated messages

---

## Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/rarva/Hello-World.git
cd Hello-World
git checkout v1.0.0-auth-system
```

### 2. Configure Supabase
Create `config.js`:
```javascript
window.SUPABASE_URL = 'https://your-project.supabase.co';
window.SUPABASE_ANON_KEY = 'your-anon-key';
```

### 3. Run Locally
```bash
python -m http.server 8000
# Visit http://localhost:8000
```

### 4. Test Features
- **Sign up:** Register with email/password → language auto-saved
- **Login:** Email and remember-me checkbox work
- **Session:** Close tab → reopen → stay logged in
- **Languages:** Switch language → immediately applied → persisted to profile

---

## Project Structure

```
├── index.html                 # Main app shell with persistent containers
├── config.js                  # Supabase credentials (git-ignored)
├── strings.json              # All UI translations (30+ keys × 5 languages)
├── strings_helper.js         # i18n + browser language detection
├── load_control.js           # Container loader + session checker
├── styles.css                # Base layout (flexbox)
│
├── login/                    # Authentication system
│   ├── login.html
│   ├── load_login.js         # Signup/login/logout logic
│   └── login_styles.css
│
├── footer/                   # Footer with logout
│   ├── footer.html
│   ├── load_footer.js
│   └── footer_styles.css
│
└── migrations/
    └── 001_create_profiles.sql
```

---

## Supabase Setup

1. Create project at https://supabase.com
2. Run in SQL Editor:
   ```sql
   CREATE TABLE profiles (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email TEXT UNIQUE NOT NULL,
     full_name TEXT,
     language TEXT DEFAULT 'en',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );
   ```
3. Get Project URL and Anon Key → add to `config.js`
4. Enable email/password auth (disable confirmation for testing)

---

## Security Notes

✅ **Secure:**
- Passwords not stored in localStorage
- Session tokens encrypted by Supabase
- All secrets in `.gitignore`

⚠️ **Production:**
- Enable Row Level Security (RLS) in Supabase
- Enable email confirmation
- Use environment variables for keys
- Enable HTTPS

---

## Multi-Language System

**First Visit:** Browser language auto-detected → fallback to English

**After Signup:** Language preference saved to user profile

**After Login:** Language loaded from profile (browser language ignored)

**Adding Translations:** Add to `strings.json`, use `getString()` in code

---

## Known Issues / Future Work

- ⚠️ Toolbar buttons in browser language (iframe context limitation)
- 🔄 Password reset
- 🔄 Email confirmation flow
- 🔄 User profile editing

---

## Tech Stack

- **Frontend:** Vanilla JavaScript
- **Backend:** Supabase (PostgreSQL + Auth)
- **i18n:** Custom JSON-based system
- **Styling:** CSS3 Flexbox

---

## Documentation

- **COPILOT_GUIDE.txt:** Development rules and constraints
- **README.md (this file):** Features and setup

---

**Version:** v1.0.0-auth-system | **Updated:** November 19, 2025

---

## Supabase + GitHub Pages (Safer Deploy)

This project supports a low-cost, safe deployment pattern where runtime Supabase keys
are injected at build time by GitHub Actions. The repo should never contain `service_role`
keys or any admin credentials.

Quick setup:

- Create a free project at https://supabase.com and note the `Project URL` and the
	`anon` key (NOT the service_role key).
- In the Supabase dashboard -> SQL Editor, run `migrations/001_create_profiles.sql` to
	create the `profiles` and `relationships` tables.
- In your GitHub repository, go to Settings -> Secrets -> Actions and add two secrets:
	- `SUPABASE_URL` = your Supabase project URL
	- `SUPABASE_ANON_KEY` = your anon key
- Commit and push your repo to the `main` branch. The workflow `.github/workflows/deploy.yml`
	will generate a `config.js` from Secrets and deploy the repo to GitHub Pages.

Security notes:
- Do NOT commit a `config.js` containing keys. Use the generated `config.js` provided by
	the Actions workflow (the file is added at runtime and is ignored by `.gitignore`).
- For public demos, ensure Row Level Security (RLS) policies in Supabase restrict access
	as appropriate. By default, tables may be open for reads/writes—configure policies to
	allow only authenticated users to insert/select/modify their rows.

Local development:
- If you want to test locally without Actions, create a `config.js` in the repo root with:
	```js
	window.SUPABASE_URL = 'https://your-project.supabase.co';
	window.SUPABASE_ANON_KEY = 'your-anon-key';
	```
	Do NOT commit this file—it's for local testing only.

Migration & import:
- If you have existing users stored in localStorage, use `migrate_users.js` to import them.
	This script requires `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (the service_role key)
	as environment variables and must be run locally.
