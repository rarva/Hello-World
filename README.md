# Hello-World
Rhomberg OrgChart Admin - Multi-language authentication system with Supabase backend

Company colors: #DA162A (Dark Red), #EB8318 (Orange), #010101 (Black)

## Current Version: v1.0.1-onboarding-complete (Latest: Avatar + Profile Onboarding)

### Development Status: ✅ STABLE
Complete authentication system with post-signup onboarding, avatar management, and profile data collection fully implemented and tested.

### Latest Update (Current Release - v1.0.1)
**Avatar Upload & Profile Onboarding System**
- **Avatar component:** Independent reusable component with drag-and-drop file selection
- **Image compression:** Canvas-based compression to 220×220px PNG (30-80KB typical)
- **Supabase Storage:** Public file hosting with automatic URL retrieval
- **Initials fallback:** Deterministic 10-color palette for auto-generated avatars
- **Onboarding modal:** Post-signup profile completion (first name, last name, manager email)
- **Profile persistence:** All user data saved to `profiles` table with avatar URL
- **Two-element button UI:** Avatar plus button expands to CHOOSE FILE (smooth UX)
- **Clean error handling:** Specific messages for missing fields, failed uploads, database errors
- **Login/onboarding flow:** Seamless transition with proper modal layering

### Previous Version (v1.0.0-auth-system)
- **Code restructuring:** Standardized file naming convention (load_*.js → *_init.js)
- **Auth logic separation:** Split login module into login_init.js (UI) + login_auth.js (authentication)
- **UI Polish:** Removed animation jank, improved focus states, better password visibility
- **HTML cleanup:** Removed unused IDs, added missing elements, improved accessibility
- **CSS centralization:** --color-button variable for global button color control
- **Directory normalization:** Lowercase asset paths (Assets/Images → assets/images)

---

## Features Implemented

### ✅ Avatar Management System (v1.0.1)
- **Avatar upload:** Click plus button → select file → preview displayed
- **Drag-and-drop:** Drop image files onto avatar area for immediate preview
- **Image compression:** Canvas-based resize to 220×220px PNG format
- **Supabase Storage:** Upload to `public/` folder in "avatars" bucket
- **Initials fallback:** Auto-generate avatar with first/last name initials
- **Deterministic colors:** 10-color professional palette, same person = same color
- **Graceful errors:** If upload fails, seamlessly fallback to initials avatar
- **File size validation:** Automatic compression to 30-80KB typical

### ✅ Profile Onboarding (v1.0.1)
- **Onboarding modal:** Appears after successful signup
- **Required fields:** First name, last name, reports-to email address
- **Form validation:** All fields validated before save, errors displayed inline
- **Profile data persistence:** All fields saved to `profiles` table
- **Avatar URL storage:** Public Supabase Storage URL saved with profile
- **User confirmation:** After save, modal hidden and home page loaded
- **Returning incomplete profiles:** Users with incomplete profiles see onboarding on login

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
---

## Recent Refactoring (v1.0.0-auth-system cleanup)

### File Organization Improvements
- **Standardized naming:** All module loaders renamed from `load_*.js` to `*_init.js`
  - `load_login.js` → `login_init.js` + new `login_auth.js` (auth logic)
  - `load_footer.js` → `footer_init.js`
  - `load_home.js` → `home_init.js`
  - `load_toolbar.js` → `toolbar_init.js`
- **Removed obsolete files:** `load_control.js`, `lang_switcher.js`, deprecated error handlers
- **Directory normalization:** `Assets/Images/` → `assets/images/` (lowercase consistency)

### HTML & ID Cleanup
- **Removed unused IDs:** `language-switcher`, `confirm-wrapper`, `general-error`
- **Added missing element:** `signup-btn` (was referenced in JS but didn't exist)
- **Improved accessibility:** Added `tabindex="0"` to signup link for keyboard focus

### UI/UX Polish
- **Password visibility:** Increased bullet size to 30px for better readability
- **Animation refinement:** Removed font-size animation jank on password toggle
- **Focus states:** Removed large focus outlines from language button and eye button
- **Eye button:** Now 54px circles with opacity control (0.5 hidden, 1.0 showing)

### CSS Improvements
- **Centralized button colors:** New `--color-button` variable (set to #EB8318 orange)
- **Login button:** Now uses `--color-button` for easy global control
- **Cleaned styling:** Removed blank lines, unused selectors, inconsistent spacing
- **Unified containers:** `.login-wrapper` now matches `#login-container` styling

### Developer Experience
- **Translation updates:** Brand subtitle now includes "- OrgChart" (all 5 languages)
- **String consistency:** Password placeholder standardized to small dots (••••••••)

---

## Deployment & Configuration

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
