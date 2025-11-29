````markdown
# Hello-World
Rhomberg OrgChart Admin — multi-language authentication + onboarding demo (Supabase backend)

Company design tokens: `--color-primary: #DA162A`, `--color-button: #EB8318`, `--color-black: #010101`

## Current Version: v1.0.7-manager-email-unify (Latest: Manager Email & Requests fixes)

### Development Status: ✅ STABLE
Complete authentication system with post-signup onboarding, avatar management, and profile data collection fully implemented and tested.

### Latest Update (Current Release - v1.0.7)
**Manager Email & Requests UI Fixes**
- Fixed Requests UI mounting so it only appears when items exist (avoids empty panel behind onboarding).
- Added robust token resolution for requests list/respond calls and login-first validate links.
- Forced sign-out behavior on email validate links to avoid same-browser session confusion.
- Repaired avatar click handling so the user menu can open even while avatar prefetch is in progress.
- Cleaned and consolidated email client shim and server send flow to use server-side template rendering.
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
  - `full_name` (text) - deprecated, use first_name + last_name
  - `first_name` (text) - user's first name
  - `last_name` (text) - user's last name
  - `reports_to_email` (text) - manager's email address
  - `avatar_url` (text) - public Supabase Storage URL
  - `language` (text - user's preferred language)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
- User data synchronized between auth system and database

### ✅ Multi-Language Support (5 Languages)
- **Languages:** English (en), Portuguese (pt), German (de), French (fr), Italian (it)
- **Auto-detection:** Browser/system language detected on first visit → fallback to English
- **Persistence:** User's language preference saved to their profile in database
- **Smart loading:** Language loaded from user's profile after login (not from browser)
- **All UI text from language_strings.json** (Rule 1: No hardcoded English text)
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

## Quick Start (reproduce this snapshot)

1. Clone and checkout the snapshot branch:

```powershell
git clone https://github.com/rarva/Hello-World.git
cd Hello-World
git checkout backup/v1.0.1-onboarding-2025-11-22
```

2. Create a local `config.js` for development (DO NOT commit):

```javascript
window.SUPABASE_URL = 'https://your-project.supabase.co';
window.SUPABASE_ANON_KEY = 'your-anon-key';
```

3. Start a static server and open the app:

```powershell
python -m http.server 8000
# Open http://localhost:8000 in your browser
```

4. Optional: run uniformity checks (recommended during refactors)

```powershell
# Detached background job (PowerShell):
Start-Job -ScriptBlock { node .\uniformity_checks\run_all_checks.js }

# Synchronous run for CI or pre-commit checks:
node .\uniformity_checks\run_all_checks.js --sync
# Results written to .\uniformity_checks\check-output.txt
```

---

## Project Structure

```
├── index.html                 # Main app shell with persistent containers
├── main.js                    # Session management + UI orchestration
├── config.js                  # Supabase credentials (git-ignored)
├── language_strings.json              # All UI translations (30+ keys × 5 languages)
├── language_manager.js         # i18n + browser language detection
├── styles.css                # Base layout (flexbox)
│
├── avatar/                   # Avatar upload + initials fallback
│   ├── avatar.html
│   ├── avatar_init.js        # Setup + upload to Supabase Storage
│   └── avatar_styles.css
│
├── login/                    # Authentication system
│   ├── login.html
│   ├── login_init.js         # UI initialization
│   ├── login_auth.js         # Signup/login/logout logic
│   ├── login_errors.js       # Error handling
│   └── login_styles.css
│
├── onboarding/               # Post-signup profile completion
│   ├── onboarding.html
│   ├── onboarding_init.js    # Modal + form handling
│   ├── onboarding_errors.js  # Form validation errors
│   └── onboarding_styles.css
│
├── toolbar/                  # Top navigation bar
│   ├── toolbar.html
│   ├── toolbar_init.js       # Setup + styling
│   ├── toolbar_errors.js     # Error handling
│   └── toolbar_styles.css
│
├── home/                     # Main app page
│   ├── home.html
│   ├── home_init.js          # Setup + view loading
│   ├── home_errors.js        # Error handling
│   └── home_styles.css
│
├── footer/                   # Footer with logout
│   ├── footer.html
│   ├── footer_init.js        # Setup + logout handling
│   ├── footer_errors.js      # Error handling
│   └── footer_styles.css
│
└── migrations/
    ├── 001_create_profiles.sql
    └── 002_extend_profiles.sql
```

---

## Supabase Setup

1. Create project at https://supabase.com
2. Run in SQL Editor both migration files:
   ```sql
   -- Migration 001_create_profiles.sql
   CREATE TABLE profiles (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email TEXT UNIQUE NOT NULL,
     full_name TEXT,
     language TEXT DEFAULT 'en',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );
   
   -- Migration 002_extend_profiles.sql (v1.0.1+)
   ALTER TABLE profiles ADD COLUMN first_name TEXT;
   ALTER TABLE profiles ADD COLUMN last_name TEXT;
   ALTER TABLE profiles ADD COLUMN reports_to_email TEXT;
   ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
   ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
   ```
3. Get Project URL and Anon Key → add to `config.js`
4. Enable email/password auth (disable confirmation for testing)
5. Create `avatars` Storage bucket:
   - Visibility: Public
   - Enable public read access in RLS policies
6. Set RLS Policies on avatars bucket:
   - **SELECT:** Allow `bucket_id = 'avatars' AND extension = 'png'` for all users
   - **INSERT:** Allow `bucket_id = 'avatars' AND extension = 'png'` for authenticated users

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

**Adding Translations:** Add to `language_strings.json`, use `getString()` in code

---

## Known Issues / Future Work

- ⚠️ Toolbar buttons in browser language (iframe context limitation)
- 🔄 Password reset functionality
- 🔄 Email confirmation flow
- 🔄 Profile editing/settings page
- 🔄 Manager email invitation trigger
- 🔄 Avatar display in home and toolbar components
- 🔄 Optional profile fields (company, department, phone, bio)

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

**Version:** v1.0.7-manager-email-unify | **Updated:** November 29, 2025

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

---

## Backup Snapshot: v1.0.1-onboarding-complete (2025-11-22)

This is a stable project snapshot created before further refactors. It includes the
following notable changes since the previous release listed above:

- Renamed `containers/profile` → `containers/user_menu` and added compatibility shims
  (`user_menu_init.js` exports new names while mapping old `initProfileModal` /
  `openProfileModal` back to the new API).
- Added uniformity tooling under `uniformity_checks/` to detect hardcoded fonts, colors,
  strings, scrollbar styles, and tooltip issues; the runner supports background runs.
- Avatar improvements: preview image fills placeholder (`object-fit: cover`), plus-icon
  SVG viewBox normalized so the glyph scales to the button, and CSS adjusted.
- Updated `containers/toolbar/toolbar_init.js` to call the new `user_menu` API.

Branch + commit:

- Branch created: `backup/v1.0.1-onboarding-2025-11-22`
- Commit: `chore(backup): stable snapshot v1.0.1-onboarding-complete (2025-11-22)`

If you want a full rename of DOM IDs and classes from `profile-*` → `user_menu-*`,
I can perform that as a follow-up (it is more invasive and will update many selectors
and CSS rules).

````

## Version v1.0.5 - Release Notes (Nov 25, 2025)

### Overview
This release consolidates the server-side email sending workflow, stabilizes the onboarding/profile notification integration, hardens auth validation for the edge handler, and updates developer documentation. It also includes operational guidance for updating SendGrid credentials and redeploying the production handler.

### ✅ Features & Improvements
- EMAILS area finalized: `EMAILS/server` (edge handler), `EMAILS/client` (browser wrapper), and `EMAILS/templates` (HTML fallback) are standardized and documented.
- Non-blocking notification sends wired from onboarding and profile save handlers (`containers/onboarding/onboarding_init.js`, `containers/user_profile/user_profile_init.js`).
- Edge handler robustified: Supabase token validation now supplies the `apikey` header when calling the Supabase auth endpoint; SendGrid payload logic falls back to inline HTML when `template_id` appears to be an alias instead of a GUID.
- Production deploy trimmed noisy debug logs and was re-deployed to ensure runtime matches repository state.

### 🛠️ Operational Notes (SendGrid & Env)
- Environment variables required (set in hosting environment; do NOT commit):
  - `SENDGRID_API_KEY` — SendGrid API key used by the edge handler
  - `EMAIL_FROM` — Verified sender address used in outgoing messages
  - `SUPABASE_URL` — Your Supabase project URL
  - `SUPABASE_ANON_KEY` — Supabase anon public key (used for server-side auth validation header)

- If you rotate or change `SENDGRID_API_KEY`, update it in your hosting environment (Vercel shown as primary example) and then redeploy production. Quick CLI steps:

```powershell
# Add or update the key interactively
vercel env add SENDGRID_API_KEY production

# Or add as a secret and attach it
vercel secrets add sendgrid-api-key-secret "sk_live_xxx..."
vercel env add SENDGRID_API_KEY production
# choose 'Use existing secret' when prompted

# Trigger a production redeploy
vercel --prod --yes
```

### 🔍 Smoke Test After Deploy
1. Create a test user in the app or use the onboarding flow to trigger a notification send.
2. Tail the production logs for `send-manager-notification` and watch for 2xx responses from SendGrid.

```powershell
vercel logs <project-name-or-url> --since 5m --prod
```

3. Confirm delivery in your test inbox. If SendGrid returns 401/403, verify `SENDGRID_API_KEY` is correct and `EMAIL_FROM` is a verified sender in SendGrid.

### ⚠️ Known Issues
- If `send-manager-notification` receives a `template_id` that is not a GUID (for example, friendly aliases), the handler will send the `html` fallback instead of attempting to use SendGrid templates. If you want template aliasing, create the transactional templates in SendGrid first and update client/server to use GUIDs, or reintroduce a server-side alias→GUID mapping.

### 📦 Release Tag
This commit is tagged as `v1.0.5` in the repository.

---# Hello-World
Rhomberg OrgChart Admin — multi-language authentication + onboarding demo (Supabase backend)

Company design tokens: `--color-primary: #DA162A`, `--color-button: #EB8318`, `--color-black: #010101`

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
  - `full_name` (text) - deprecated, use first_name + last_name
  - `first_name` (text) - user's first name
  - `last_name` (text) - user's last name
  - `reports_to_email` (text) - manager's email address
  - `avatar_url` (text) - public Supabase Storage URL
  - `language` (text - user's preferred language)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
- User data synchronized between auth system and database

### ✅ Multi-Language Support (5 Languages)
- **Languages:** English (en), Portuguese (pt), German (de), French (fr), Italian (it)
- **Auto-detection:** Browser/system language detected on first visit → fallback to English
- **Persistence:** User's language preference saved to their profile in database
- **Smart loading:** Language loaded from user's profile after login (not from browser)
- **All UI text from language_strings.json** (Rule 1: No hardcoded English text)
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

## Quick Start (reproduce this snapshot)

1. Clone and checkout the snapshot branch:

```powershell
git clone https://github.com/rarva/Hello-World.git
cd Hello-World
git checkout backup/v1.0.1-onboarding-2025-11-22
```

2. Create a local `config.js` for development (DO NOT commit):

```javascript
window.SUPABASE_URL = 'https://your-project.supabase.co';
window.SUPABASE_ANON_KEY = 'your-anon-key';
```

3. Start a static server and open the app:

```powershell
python -m http.server 8000
# Open http://localhost:8000 in your browser
```

4. Optional: run uniformity checks (recommended during refactors)

```powershell
# Detached background job (PowerShell):
Start-Job -ScriptBlock { node .\uniformity_checks\run_all_checks.js }

# Synchronous run for CI or pre-commit checks:
node .\uniformity_checks\run_all_checks.js --sync
# Results written to .\uniformity_checks\check-output.txt
```

---

## Project Structure

```
├── index.html                 # Main app shell with persistent containers
├── main.js                    # Session management + UI orchestration
├── config.js                  # Supabase credentials (git-ignored)
├── language_strings.json              # All UI translations (30+ keys × 5 languages)
├── language_manager.js         # i18n + browser language detection
├── styles.css                # Base layout (flexbox)
│
├── avatar/                   # Avatar upload + initials fallback
│   ├── avatar.html
│   ├── avatar_init.js        # Setup + upload to Supabase Storage
│   └── avatar_styles.css
│
├── login/                    # Authentication system
│   ├── login.html
│   ├── login_init.js         # UI initialization
│   ├── login_auth.js         # Signup/login/logout logic
│   ├── login_errors.js       # Error handling
│   └── login_styles.css
│
├── onboarding/               # Post-signup profile completion
│   ├── onboarding.html
│   ├── onboarding_init.js    # Modal + form handling
│   ├── onboarding_errors.js  # Form validation errors
│   └── onboarding_styles.css
│
├── toolbar/                  # Top navigation bar
│   ├── toolbar.html
│   ├── toolbar_init.js       # Setup + styling
│   ├── toolbar_errors.js     # Error handling
│   └── toolbar_styles.css
│
├── home/                     # Main app page
│   ├── home.html
│   ├── home_init.js          # Setup + view loading
│   ├── home_errors.js        # Error handling
│   └── home_styles.css
│
├── footer/                   # Footer with logout
│   ├── footer.html
│   ├── footer_init.js        # Setup + logout handling
│   ├── footer_errors.js      # Error handling
│   └── footer_styles.css
│
└── migrations/
    ├── 001_create_profiles.sql
    └── 002_extend_profiles.sql
```

---

## Supabase Setup

1. Create project at https://supabase.com
2. Run in SQL Editor both migration files:
   ```sql
   -- Migration 001_create_profiles.sql
   CREATE TABLE profiles (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email TEXT UNIQUE NOT NULL,
     full_name TEXT,
     language TEXT DEFAULT 'en',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );
   
   -- Migration 002_extend_profiles.sql (v1.0.1+)
   ALTER TABLE profiles ADD COLUMN first_name TEXT;
   ALTER TABLE profiles ADD COLUMN last_name TEXT;
   ALTER TABLE profiles ADD COLUMN reports_to_email TEXT;
   ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
   ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
   ```
3. Get Project URL and Anon Key → add to `config.js`
4. Enable email/password auth (disable confirmation for testing)
5. Create `avatars` Storage bucket:
   - Visibility: Public
   - Enable public read access in RLS policies
6. Set RLS Policies on avatars bucket:
   - **SELECT:** Allow `bucket_id = 'avatars' AND extension = 'png'` for all users
   - **INSERT:** Allow `bucket_id = 'avatars' AND extension = 'png'` for authenticated users

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

**Adding Translations:** Add to `language_strings.json`, use `getString()` in code

---

## Known Issues / Future Work

- ⚠️ Toolbar buttons in browser language (iframe context limitation)
- 🔄 Password reset functionality
- 🔄 Email confirmation flow
- 🔄 Profile editing/settings page
- 🔄 Manager email invitation trigger
- 🔄 Avatar display in home and toolbar components
- 🔄 Optional profile fields (company, department, phone, bio)

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

**Version:** v1.0.1-onboarding-complete | **Updated:** November 20, 2025

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

---

## Backup Snapshot: v1.0.1-onboarding-complete (2025-11-22)

This is a stable project snapshot created before further refactors. It includes the
following notable changes since the previous release listed above:

- Renamed `containers/profile` → `containers/user_menu` and added compatibility shims
  (`user_menu_init.js` exports new names while mapping old `initProfileModal` /
  `openProfileModal` back to the new API).
- Added uniformity tooling under `uniformity_checks/` to detect hardcoded fonts, colors,
  strings, scrollbar styles, and tooltip issues; the runner supports background runs.
- Avatar improvements: preview image fills placeholder (`object-fit: cover`), plus-icon
  SVG viewBox normalized so the glyph scales to the button, and CSS adjusted.
- Updated `containers/toolbar/toolbar_init.js` to call the new `user_menu` API.

Branch + commit:

- Branch created: `backup/v1.0.1-onboarding-2025-11-22`
- Commit: `chore(backup): stable snapshot v1.0.1-onboarding-complete (2025-11-22)`

If you want a full rename of DOM IDs and classes from `profile-*` → `user_menu-*`,
I can perform that as a follow-up (it is more invasive and will update many selectors
and CSS rules).
