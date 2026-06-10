# Sunbird Portal

A modern, scalable educational platform built with React and Node.js, designed for national-scale deployment.Sunbird is a next-generation scalable open-source learning solution for teachers and tutors. Built for the 21st century with state-of-the-art technology, Sunbird runs natively in cloud/mobile environments. The open-source governance of Sunbird allows a massive community of nation-builders to co-create and extend the solution in novel ways.

## Architecture Overview

This is a **monorepo** containing two independent applications:

- **`frontend/`** — React 19 + TypeScript + Vite single-page application (Sunbird Ed Portal UI)
- **`backend/`** — Express 5 + TypeScript + Node.js API server

In **production**, the backend serves the frontend's static build from `dist/public/`. In **development**, Vite runs on port 5173 and proxies API/content requests to the backend on port 3000.

### Frontend Architecture

- **Routing**: React Router 7
- **Server state**: TanStack Query v5
- **Styling**: Tailwind CSS with custom Sunbird design tokens
- **UI primitives**: Radix UI components
- **i18n**: i18next + react-i18next
- **Path alias**: `@/` maps to `frontend/src/`

Key frontend layers:

| Directory | Purpose |
|---|---|
| `src/api/` | Axios-based API client functions |
| `src/auth/` | Authentication context (AuthContext) |
| `src/services/` | Business logic, display config (icons, colors per content type) |
| `src/providers/` | React context providers (i18n direction, telemetry) |
| `src/rbac/` | Role-based access control (ProtectedRoute, PermissionGate, OnboardingGuard) |
| `src/hooks/` | Custom React hooks |
| `src/components/` | Reusable UI components |
| `src/pages/` | Route-level page components |
| `src/utils/` | Shared utility functions |
| `src/types/` | TypeScript type definitions |
| `src/configs/` | App configuration (i18n, languages) |

### Backend Architecture

- **Framework**: Express 5 with TypeScript (ESM)
- **Auth**: OIDC/Keycloak (openid-client), Google OAuth, mobile Keycloak redirect
- **Databases**: YugabyteDB (via `pg`)
- **Sessions**: express-session with connect-pg-simple
- **Proxy**: http-proxy-middleware routes content/plugin requests to upstream Sunbird services
- **Logging**: winston
- **Security**: helmet
- **Validation**: ajv

Key backend layers:

| Directory | Purpose |
|---|---|
| `src/routes/` | Express route definitions |
| `src/controllers/` | Request handlers |
| `src/services/` | Business logic (user, org, tenant, telemetry, forms, auth) |
| `src/auth/` | OIDC provider and middleware |
| `src/middlewares/` | Express middleware (auth, session, validation) |
| `src/proxies/` | Upstream service proxy config (Kong, Knowlg, user) |
| `src/databases/` | Database access (forms, review comments) |
| `src/config/` | Typed environment variable access (`env.ts`) |
| `src/utils/` | Logger, session store, proxy utilities |
| `src/models/` | Data models |
| `src/types/` | TypeScript type definitions and declaration files |

### Vite Dev Proxy

In development, the following paths are proxied from Vite (port 5173) to the backend (port 3000):

`/portal`, `/content/preview`, `/assets/public`, `/content-plugins`, `/content-editor`, `/action`, `/plugins`, `/api`, `/generic-editor`

### Authentication & Authorization

**Backend** handles authentication via OIDC/Keycloak and Google OAuth. Once authenticated, user data is passed to the frontend.

**Frontend** manages auth state via React Context:

- `AuthContext` (`src/auth/AuthContext.tsx`) provides `user`, `isAuthenticated`, `login()`, `logout()`
- `useAuth()` hook — access auth state from any component
- User object contains `id`, `name`, and `roles`

**RBAC Roles** (defined in `AuthContext`):

`CONTENT_CREATOR` | `CONTENT_REVIEWER` | `BOOK_CREATOR` | `BOOK_REVIEWER` | `PUBLIC` | `ORG_ADMIN` | `COURSE_MENTOR`

**RBAC layer** (`src/rbac/`) provides route-level and component-level access control:

| Component | Purpose |
|---|---|
| `ProtectedRoute` | Wraps routes that require authentication |
| `PermissionGate` | Conditionally renders children based on user roles |
| `OnboardingGuard` | Ensures users complete onboarding before accessing the app |
| `AccessControl` | General-purpose access control wrapper |

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.1 | UI library |
| TypeScript | 5.9.3 | Type safety |
| Vite | 7.3.1 | Build tool & dev server |
| React Router | 7.x | Client-side routing |
| TanStack Query | 5.x | Server state management |
| Tailwind CSS | 3.4.x | Utility-first styling |
| Radix UI | Latest | Accessible UI primitives |
| Axios | 1.13.2 | HTTP client |
| i18next | 25.x | Internationalization |
| Recharts | 3.x | Charting |
| DayJS | 1.x | Date utilities |
| jsPDF | 4.x | PDF generation |
| DOMPurify | 3.x | HTML sanitization |

#### Sunbird Web Components

| Package | Version | Purpose |
|---|---|---|
| @project-sunbird/sunbird-pdf-player-web-component | 2.x | PDF content player |
| @project-sunbird/sunbird-video-player-web-component | 2.x | Video content player |
| @project-sunbird/sunbird-epub-player-web-component | 2.x | ePub content player |
| @project-sunbird/sunbird-quml-player-web-component | 6.x | QUML question player |
| @project-sunbird/sunbird-questionset-editor-web-component | 6.x | QuestionSet editor |
| @project-sunbird/sunbird-collection-editor-web-component | 2.x | Collection/course editor |
| @project-sunbird/telemetry-sdk | 2.x | Telemetry instrumentation |

> These web components require their static assets to be available at `public/assets/`. This is handled automatically by the `copy-assets.js` postinstall script (see [Frontend Setup](#2-frontend-setup)).

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 24.12.0 | Runtime |
| Express | 5.2.1 | Web framework |
| TypeScript | 5.9.3 | Type safety |
| openid-client | 6.x | OIDC/Keycloak authentication |
| google-auth-library | 10.x | Google OAuth |
| pg | 8.x | PostgreSQL client |
| @yugabytedb/pg | 8.x | YugabyteDB client |
| cassandra-driver | 4.x | Cassandra client |
| express-session | 1.x | Session management |
| connect-pg-simple | 10.x | PostgreSQL session store |
| http-proxy-middleware | 3.x | Upstream service proxying |
| helmet | 8.x | Security headers |
| winston | 3.x | Logging |
| ajv | 8.x | JSON schema validation |
| CORS | 2.8.5 | Cross-origin resource sharing |

### Development & Testing Tools

| Tool | Purpose |
|---|---|
| ESLint 9.x | Linting with TypeScript support |
| Prettier 3.x | Code formatting |
| Vitest 4.x | Unit & integration testing (frontend + backend) |
| @testing-library/react | React component testing |
| happy-dom | DOM environment for frontend tests |
| supertest | HTTP integration testing (backend) |
| tsx | TypeScript execution with hot reload (backend dev) |
| SonarQube | Code quality analysis |
| GitHub Actions | CI/CD pipeline |

## Theming System

The portal retints from a single block of CSS variables in `frontend/src/index.css` driven by 6 seed values per palette. Palettes, fonts, themes, templates and layouts are defined in **one file** (`frontend/src/theme/themes.ts`) and applied at runtime via `ThemeProvider`. The user picks colour / font / template / layout from the brush icon in the header — selection persists in `localStorage`.

Five concepts:

1. **Colour palette** — 6 seed HSL values drive every brand colour.
2. **Font family** — one CSS var (`--app-font-family`) drives the font used everywhere.
3. **Theme** — pairs a `colorId` (palette) with a `fontId` (font). Switching theme applies both.
4. **Template** — `data-template` attribute on `<html>` swaps radius scale + shadow scale. Picking a template also auto-applies its preset theme + preset font.
5. **Layout** — `data-layout` attribute on `<html>` controls navigation chrome (left sidebar / right sidebar / top nav / bottom nav). Portal-only (mobile app has no layout option).

> **Mobile parity:** the portal follows the same recipe as `sunbird-spark-mobile-app`. The main difference is the **theme = colour + font** indirection (mobile inlines seeds into theme entries; portal references `colorId`/`fontId`) and the **layout** axis (portal-only).

---

### Part 1 — Colour Palette (the 6 Seed Variables)

Open `frontend/src/index.css` and find the seed block at the top:

```css
:root {
  --sunbird-spark-theme-primary-h: 12;   --sunbird-spark-theme-primary-s: 50%;   --sunbird-spark-theme-primary-l: 45%;
  --sunbird-spark-theme-chip-h:    45;   --sunbird-spark-theme-chip-s:    100%;
  --sunbird-spark-theme-icon-h:    28;
}
```

Every other colour token in the app is **derived** from these 6 values. Change them → whole app retints.

#### What each variable means

Colours are written in **HSL** format — Hue, Saturation, Lightness.

- **Hue (h)** — `0–360`. Position on the colour wheel. `0` = red, `120` = green, `240` = blue, `360` = red again.
- **Saturation (s)** — `0%–100%`. How vivid. `0%` = gray, `100%` = full colour.
- **Lightness (l)** — `0%–100%`. How light/dark. `0%` = black, `50%` = pure, `100%` = white.

| # | Variable | Meaning | What it controls |
|---|---|---|---|
| 1 | `--sunbird-spark-theme-primary-h` | Hue of the **primary brand colour** | Primary CTAs, active states, links, progress fills, focus rings, active indicators |
| 2 | `--sunbird-spark-theme-primary-s` | Saturation of the primary | How vivid the primary is. Higher = more vibrant |
| 3 | `--sunbird-spark-theme-primary-l` | Lightness of the primary | How light/dark the primary is. Lower = deeper, higher = paler |
| 4 | `--sunbird-spark-theme-chip-h` | Hue of **chips/badges/secondary surfaces** | Badge backgrounds, card backgrounds, tag tints, section accent surfaces |
| 5 | `--sunbird-spark-theme-chip-s` | Saturation of chip surfaces | How vivid the chip surfaces are |
| 6 | `--sunbird-spark-theme-icon-h` | Hue of **muted icons and chart accents** | Muted icons, chart strokes, secondary accents. Lightness locked at `54%` for readability |

The primary uses 3 values (hue + saturation + lightness) because the primary CTA needs a specific shade to read correctly. Chip and icon only need a hue — their lightness scale is fixed across themes (see "Lightness Scale" below).

#### Examples — change the theme to anything

**Royal purple**
```css
--sunbird-spark-theme-primary-h: 270;  --sunbird-spark-theme-primary-s: 55%;  --sunbird-spark-theme-primary-l: 45%;
--sunbird-spark-theme-chip-h:    270;  --sunbird-spark-theme-chip-s:    55%;
--sunbird-spark-theme-icon-h:    280;
```

**Forest green**
```css
--sunbird-spark-theme-primary-h: 140;  --sunbird-spark-theme-primary-s: 40%;  --sunbird-spark-theme-primary-l: 32%;
--sunbird-spark-theme-chip-h:    140;  --sunbird-spark-theme-chip-s:    40%;
--sunbird-spark-theme-icon-h:    130;
```

**Energetic orange**
```css
--sunbird-spark-theme-primary-h: 24;   --sunbird-spark-theme-primary-s: 95%;  --sunbird-spark-theme-primary-l: 53%;
--sunbird-spark-theme-chip-h:    35;   --sunbird-spark-theme-chip-s:    100%;
--sunbird-spark-theme-icon-h:    20;
```

**Cool teal**
```css
--sunbird-spark-theme-primary-h: 180; --sunbird-spark-theme-primary-s: 38%;  --sunbird-spark-theme-primary-l: 38%;
--sunbird-spark-theme-chip-h:    180; --sunbird-spark-theme-chip-s:    38%;
--sunbird-spark-theme-icon-h:    170;
```

Save the file → browser auto-reloads with the new theme. No restart needed.

#### How the derivation works

Each derived token in the app references the seeds. Example:

```css
--primary: var(--sunbird-spark-theme-primary-h) var(--sunbird-spark-theme-primary-s) var(--sunbird-spark-theme-primary-l);
--card: var(--sunbird-spark-theme-chip-h) var(--sunbird-spark-theme-chip-s) 97%;
--sunbird-theme-tint: var(--sunbird-spark-theme-chip-h) var(--sunbird-spark-theme-chip-s) 93%;
```

Saturation is locked to the chip seed. Only lightness varies per token:

| Lightness | Usage |
|---|---|
| 97% | Card bodies — barely tinted |
| 93% | Badge backgrounds, consent boxes |
| 89% | Section/tag tints |
| 73% | Medium chip accents |
| 66% | Ghost button hovers, secondary accents |
| 54% | Badge borders |
| 42% | Dark text on chip-coloured surfaces |

---

### Part 2 — Font Family

The global font is controlled by one variable in `frontend/src/index.css`:

```css
--app-font-family: 'Poppins', sans-serif;
```

This variable is read by:
- The `body` rule in `frontend/src/styles/global.css` → every text element on the page.
- Tailwind's `font-rubik` utility class → maps to `var(--app-font-family)` in `tailwind.config.ts`.

So **changing this one variable retypes the entire app** — every page, every component, every heading.

But changing the variable alone is not enough — the browser also needs the **actual font file** to render. The variable is only the name; the file is what the browser draws with. Two ways to provide the file:

---

#### Option 1 — Self-host (download woff2, define `@font-face`)

This is what the project does today for Poppins, Rubik, and Satisfy.

**Pros:**
- Works offline / in air-gapped deployments
- No third-party privacy concerns (no external CDN sees user IPs)
- Faster — same origin as the app
- Stricter Content-Security-Policy (`font-src 'self'`)

**Cons:**
- Manual setup (download files, write `@font-face`)
- Font files live in the repo (`public/fonts/`)

**Steps:**

1. **Download the woff2 file** from Google Fonts CDN (or another woff2 source). The real woff2 URL is hidden inside the Google Fonts CSS — fetch the CSS with a Chrome user-agent to see it:

```bash
# Step 1a: get the real woff2 URL
curl -s -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap"
# → look for src: url(https://fonts.gstatic.com/s/inter/...woff2)

# Step 1b: download the woff2 file
curl -L "https://fonts.gstatic.com/s/inter/v18/<hash>.woff2" \
  -o frontend/public/fonts/inter-400.woff2
```

2. **Declare `@font-face`** in `frontend/src/fonts.css`. This tells the browser what file to download when CSS requests this font:

```css
@font-face {
  font-family: 'Inter';                /* the name to use in --app-font-family */
  font-style: normal;
  font-weight: 400;
  font-display: swap;                  /* show fallback while loading, then swap */
  src: url('/fonts/inter-400.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

3. **Use it** in `frontend/src/index.css`:

```css
--app-font-family: 'Inter', sans-serif;
```

Save → whole app retypes.

**For multiple weights (e.g. Poppins 300/400/500/600/700):**
Download one woff2 per weight, add **one `@font-face` block per weight file**. All blocks share the same `font-family` name — the browser picks the right file based on the `font-weight` of the element.

---

#### Option 2 — CDN (Google Fonts `@import`)

No download needed. Browser fetches the font from Google's CDN at runtime.

**Pros:**
- One-line setup
- No font files in the repo
- Always latest version

**Cons:**
- Requires internet (broken if offline / air-gapped)
- Privacy/GDPR — Google CDN sees user IPs (litigation risk in EU)
- Slower first paint (extra DNS lookup + TLS handshake to `fonts.googleapis.com` + `fonts.gstatic.com`)
- Backend CSP must allow Google domains in `font-src` and `style-src`

**Steps:**

1. **Add `@import`** at the very top of `frontend/src/index.css` (must come before `@tailwind` directives):

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap');
@import './fonts.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

URL breakdown:
- `family=Inter` — which font family
- `wght@300..700` — which weight range (variable font: 300 to 700). Can also pin specific weights like `wght@400;700`.
- `display=swap` — show fallback first, swap in when loaded (prevents invisible text flash)

2. **Use it** in the variable:

```css
--app-font-family: 'Inter', sans-serif;
```

Browser fetches the font and applies it everywhere.

**More CDN examples:**

```css
/* Serif */
@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap');
--app-font-family: 'Merriweather', serif;

/* Cursive */
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&display=swap');
--app-font-family: 'Dancing Script', cursive;

/* Multi-word family — `+` in URL, quoted with space in CSS */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300..700&display=swap');
--app-font-family: '"Plus Jakarta Sans"', sans-serif;
```

---

#### Why isn't just editing the variable enough?

`--app-font-family: 'X', sans-serif;` only tells CSS the **name** to look up. The browser needs to know **where to find** a font called `'X'`. Without a matching source — either a `@font-face` block (Option 1) or a CDN `@import` (Option 2) — the browser silently falls back to the system default.

---

### Part 3 — Adding a New Colour Palette

Open `frontend/src/theme/themes.ts` and append an entry to `COLOR_PALETTES`:

```ts
export const COLOR_PALETTES: ColorPalette[] = [
  { id: 'terracotta', name: 'Terracotta',
    seeds: { primaryH: 12, primaryS: '50%', primaryL: '45%', chipH: 45, chipS: '100%', iconH: 28 } },
  // ... existing palettes ...

  // NEW:
  { id: 'sunrise', name: 'Sunrise',
    seeds: { primaryH: 24, primaryS: '95%', primaryL: '53%', chipH: 35, chipS: '100%', iconH: 20 } },
];
```

That's it. The swatch in the ThemeSelector is auto-derived from `primaryH/S/L` (no swatch field needed).

**You do NOT need to touch:**
- `index.css` — seeds applied via JS by `applyTheme()`
- `ThemeProvider.tsx`, `ThemeSelector.tsx` — read from `COLOR_PALETTES` / `THEMES`
- Any component — they all reference derived CSS variables

A palette only becomes user-selectable once a `Theme` references it (Part 4).

---

### Part 4 — Adding a New Theme

A **Theme** binds a colour palette + font into one selectable option. Append to `THEMES`:

```ts
export const THEMES: Theme[] = [
  { id: 'terracotta', name: 'Sunbird Spark', colorId: 'terracotta', fontId: 'rubik' },
  // ... existing themes ...

  // NEW (references the palette added in Part 3):
  { id: 'sunrise', name: 'Sunrise', colorId: 'sunrise', fontId: 'poppins' },
];
```

Selecting the theme via the ThemeSelector calls `applyTheme()` (seeds → CSS vars) **and** `applyFont()` (font value → `--app-font-family`).

> **Multiple themes can reuse the same palette** with different fonts (e.g. `{colorId: 'blue', fontId: 'inter'}` and `{colorId: 'blue', fontId: 'satisfy'}`).

The user can still override the font afterward via the font picker — only the colour stays locked to the theme.

---

### Part 5 — Adding a New Font

Two-step recipe — same as the mobile app.

**Step 1** — `frontend/src/index.css` or `frontend/src/fonts.css`: add the font source (CDN `@import` or self-hosted `@font-face`). Same options as in **Part 2** above.

**Step 2** — `frontend/src/theme/themes.ts`: append to `FONTS`:

```ts
export const FONTS: FontOption[] = [
  { id: 'poppins', name: 'Poppins', value: "'Poppins', sans-serif" },
  // ... existing fonts ...

  // NEW:
  { id: 'inter', name: 'Inter', value: "'Inter', sans-serif" },
];
```

That's it. Inter shows up in the ThemeSelector font list automatically and is referenceable by `fontId: 'inter'` from any `Theme` or `Template`.

---

### Part 6 — Template (Classic / Modern / Custom)

A template = `data-template` attribute on `<html>` + radius/shadow token scale + preset theme + preset font.

Existing templates (`frontend/src/theme/themes.ts`):

```ts
export const TEMPLATES: TemplateOption[] = [
  { id: 'classic', name: 'Classic', description: 'Warm, rounded',
    presetThemeId: 'terracotta', presetFontId: 'rubik' },
  { id: 'modern',  name: 'Modern',  description: 'Sharp, bold',
    presetThemeId: 'blue',       presetFontId: 'inter' },
];
```

When the user picks a template:
1. `data-template="<id>"` is set on `<html>` — CSS picks up token values from `frontend/src/styles/template-overrides.css`.
2. The `presetThemeId` theme is auto-applied (which in turn applies the theme's `colorId` palette).
3. The `presetFontId` font is auto-applied (overriding the theme's `fontId`).
4. User can still override theme/font afterward — template attribute stays, theme/font drift.

#### How Radius (and Shadows) Work — Token-Driven

Every surface uses CSS variable tokens, not literal values:

```css
.compact-course-card { border-radius: var(--r-md); box-shadow: var(--sunbird-shadow-md); }
.hero-cta-button     { border-radius: var(--r-sm); }
.profile-avatar      { border-radius: 50%; }   /* circles stay 50%, never tokens */
```

`frontend/src/styles/template-overrides.css` defines two token families used everywhere:

| Token family | Tokens | Controls |
|---|---|---|
| **Radius** | `--r-xxs`, `--r-xs`, `--r-sm`, `--r-md`, `--r-lg`, `--r-xl`, `--r-pill`, `--radius` | `border-radius` on cards, buttons, inputs, modals. Bigger token = bigger corner. `--r-pill` = fully round capsule. |
| **Shadow** | `--sunbird-shadow-sm`, `--sunbird-shadow-md`, `--sunbird-shadow-lg` | `box-shadow` on cards/popovers. `sm` = subtle, `md` = standard card, `lg` = elevated modal. |

The `:root` block (in `template-overrides.css`) sets first-paint defaults (Classic values). Per-template blocks redefine the same tokens — that's the entire template system.

```css
/* :root — first-paint default (Classic values) */
:root {
  --r-xxs: 0.25rem;   /* 4px  — small chip, tiny dot */
  --r-xs:  0.625rem;  /* 10px — compact badge */
  --r-sm:  0.5rem;    /* 8px  — buttons, inputs */
  --r-md:  0.875rem;  /* 14px — cards, modals */
  --r-lg:  1.25rem;   /* 20px — large cards, tiles */
  --r-xl:  1.75rem;   /* 28px — feature surfaces */
  --r-pill: 9999px;   /* fully round pills */
}

/* Per-template — only the tokens change, no selector lists */
html[data-template="modern"] {
  --r-sm: 2px; --r-md: 4px; --r-lg: 6px; --r-xl: 8px; --r-pill: 0.5rem;
  --sunbird-shadow-sm: 0 1px 2px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.04);
  --sunbird-shadow-md: 0 4px 10px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.05);
  --sunbird-shadow-lg: 0 12px 28px rgba(15,23,42,0.12), 0 4px 8px rgba(15,23,42,0.06);
}
```

**Mental model:** components ask for `var(--r-md)` — the value at lookup time depends on which template is active.

Because all components read tokens, redefining the tokens for a template **automatically retunes every card, button, modal, badge, input, etc.** — no per-component selectors needed.

A template **without** an override block inherits the `:root` (Classic) values.

#### Tailwind Default Shadow Override (Portal-Specific)

Portal Modern also routes Tailwind's default `.shadow-sm` / `.shadow-md` / `.shadow-lg` utilities through the sunbird shadow tokens (so workspace, dialogs, dropdowns keep their lift):

```css
html[data-template="modern"] .shadow-sm { box-shadow: var(--sunbird-shadow-sm); }
html[data-template="modern"] .shadow-md { box-shadow: var(--sunbird-shadow-md); }
html[data-template="modern"] .shadow-lg { box-shadow: var(--sunbird-shadow-lg); }
```

If a new template wants Tailwind utilities to track its custom shadows, copy this pattern.

---

### Part 7 — Adding a New Template

Two questions decide the workflow:

| Question | Answer | What you edit |
|---|---|---|
| Reuses existing theme + font + radius? | Yes | `themes.ts` only |
| Needs new theme or new font? | Yes | Add to `COLOR_PALETTES` / `THEMES` / `FONTS` first (Parts 3 + 4 + 5), then `themes.ts` |
| Needs custom radius / shadow? | Yes | Add a token block in `template-overrides.css` |
| Skip the radius block | — | Template **automatically inherits Classic radii** |

> ⚠️ The `TemplateOption['id']` union in `themes.ts` is currently typed as `'classic' \| 'modern'`. To add a third template id, widen the union:
> ```ts
> export interface TemplateOption {
>   id: 'classic' | 'modern' | 'royal'; // ← add new id here
>   ...
> }
> ```

**Case A — Keep Classic radius (no custom radius needed):**

One entry in `frontend/src/theme/themes.ts`:

```ts
{ id: 'royal', name: 'Royal', description: 'Mint serif',
  presetThemeId: 'green', presetFontId: 'satisfy' }
```

No `template-overrides.css` change. The new template uses the same rounded radius as Classic.

**Case B — Want sharp/different radius for this template:**

Step 1: Add the template entry to `TEMPLATES` (same as Case A).

Step 2: Add a token block in `frontend/src/styles/template-overrides.css`:

```css
html[data-template="royal"] {
  --r-xxs: 0.125rem;
  --r-xs:  0.25rem;
  --r-sm:  0.25rem;
  --r-md:  0.5rem;
  --r-lg:  0.75rem;
  --r-xl:  1rem;
  --r-pill: 0.5rem;
  --radius: 0.5rem;

  /* Optional — shadows. If omitted, falls back to :root defaults. */
  --sunbird-shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --sunbird-shadow-md: 0 1px 3px rgba(0,0,0,0.06);
  --sunbird-shadow-lg: 0 2px 8px rgba(0,0,0,0.08);
}
```

That's the **only** thing needed. Every card, button, modal in the app reads these tokens and auto-applies the new scale.

> **Are shadows mandatory?** No. A template that omits the shadow override inherits the `:root` shadow defaults. Only define `--sunbird-shadow-*` if you want a different elevation style.

**Case C — New theme or font:**

1. Add to `COLOR_PALETTES` (Part 3), `THEMES` (Part 4) and/or `FONTS` (Part 5) first.
2. Then add the template entry referencing the new ids.
3. Optionally add a radius/shadow token block (Case B).

**Why no per-component selectors:** Component CSS already uses `var(--r-md)` etc. New components added later only need to use tokens — they become template-aware automatically.

---

### Part 8 — Layout (Portal-Only)

Layout controls navigation chrome — sidebar position or top/bottom nav. Selected via the same brush-icon picker.

```ts
export const LAYOUTS: LayoutOption[] = [
  { id: 'sidebar-left',  name: 'Left Sidebar' },
  { id: 'sidebar-right', name: 'Right Sidebar' },
  { id: 'top',           name: 'Top Nav' },
  { id: 'bottom',        name: 'Bottom Nav' },
];
```

`applyLayout(id)` writes `data-layout="<id>"` on `<html>`. `PageLayout.tsx` reads `activeLayout.id` and renders `HomeSidebar` / `TopNavBar` / `BottomNavBar` accordingly. Mobile viewport forces the sidebar into a drawer regardless of layout choice.

> Anonymous (unauthenticated) users always get a minimal `Header + Outlet + Footer` layout — the layout attribute is ignored for them.

To add a new layout id:
1. Append entry to `LAYOUTS` in `themes.ts`.
2. Widen the `LayoutId` union: `export type LayoutId = 'sidebar-left' | 'sidebar-right' | 'top' | 'bottom' | 'my-new-id';`
3. Handle the new id in `frontend/src/components/layout/PageLayout.tsx`.

---

### Part 9 — Default Look on First Launch

On app start, `ThemeProvider` reads `localStorage`:

| Key | Falls back to |
|---|---|
| `sunbird-theme` | `terracotta` (`DEFAULT_THEME_ID`) |
| `sunbird-font` | `poppins` (`DEFAULT_FONT_ID`) |
| `sunbird-template` | `classic` (`DEFAULT_TEMPLATE_ID`) |
| `sunbird-layout` | `sidebar-left` (`DEFAULT_LAYOUT_ID`) |

To change defaults app-wide, edit these constants in `frontend/src/theme/themes.ts`:

```ts
export const DEFAULT_THEME_ID = 'terracotta';
export const DEFAULT_FONT_ID = 'poppins';
export const DEFAULT_TEMPLATE_ID: TemplateOption['id'] = 'classic';
export const DEFAULT_LAYOUT_ID: LayoutId = 'sidebar-left';
```

---

### Part 10 — How It Works at Runtime

`frontend/src/providers/ThemeProvider.tsx` owns the state:

```ts
{ activeTheme, activeFont, activeTemplate, activeLayout,
  setTheme, setFont, setTemplate, setLayout }
```

On any state change, the matching `apply*()` function from `themes.ts` writes the appropriate CSS variable or HTML attribute:

- `applyTheme(theme)` → resolves `colorId` to seeds, writes `--sunbird-spark-theme-*` on `<html>`
- `applyFont(font)` → sets `--app-font-family`
- `applyTemplate(id)` → sets `data-template="<id>"` on `<html>`
- `applyLayout(id)` → sets `data-layout="<id>"` on `<html>`

Cascade rules (mobile parity):

- `setTheme(id)` → applies theme palette **and** the theme's `fontId`. User can override font after.
- `setTemplate(id)` → applies template radius/shadows, **and** cascades `setActiveTheme(template.presetThemeId)` + `setActiveFont(template.presetFontId)`.

---

### Quick Reference — Where to Edit What

| To do this | Edit |
|---|---|
| Change default look (first launch) | `DEFAULT_*_ID` constants in `frontend/src/theme/themes.ts` |
| Add colour palette | `COLOR_PALETTES` array in `frontend/src/theme/themes.ts` |
| Add font | `frontend/src/index.css` or `fonts.css` (`@import` / `@font-face`) + `FONTS` array in `themes.ts` |
| Add theme (colour + font pairing) | `THEMES` array in `themes.ts` (references existing `colorId` + `fontId`) |
| Add template (Classic radius) | `TEMPLATES` array in `themes.ts` only |
| Add template (custom radius) | `TEMPLATES` array + token block `html[data-template="<id>"] { --r-*: ...; --sunbird-shadow-*: ...; }` in `frontend/src/styles/template-overrides.css` |
| Tweak global radius scale for a template | Edit the matching `html[data-template="<id>"]` token block in `template-overrides.css` |
| Add layout | `LAYOUTS` array + widen `LayoutId` union + branch in `components/layout/PageLayout.tsx` |
| New component should be template-aware | Use `border-radius: var(--r-md)` and `box-shadow: var(--sunbird-shadow-md)` — no other changes needed |
| Show or hide the Theme Selector dropdown | `ENABLE_THEME_SELECTOR` in `frontend/src/configs/featureFlags.ts` |

---

### Feature Flags

Runtime UI features can be toggled without touching environment files. All flags live in one place:

**`frontend/src/configs/featureFlags.ts`**

```ts
// Set to true to show the Theme Selector dropdown in the header.
// Default: false (hidden).
export const ENABLE_THEME_SELECTOR = false;
```

#### `ENABLE_THEME_SELECTOR`

Controls the brush-icon dropdown in both the public header and the authenticated header. When `false` (the default), the dropdown is completely absent from the DOM — no hidden element, no dead click target.

**To enable:**

```ts
// frontend/src/configs/featureFlags.ts
export const ENABLE_THEME_SELECTOR = true;
```

Save the file. Vite hot-reloads instantly — no restart needed.

**To disable:**

```ts
export const ENABLE_THEME_SELECTOR = false;
```

> **Note:** Disabling the selector only hides the picker UI. The `ThemeProvider` still reads any theme already persisted in `localStorage` and applies it on load — existing user selections are preserved. To reset a user's stored theme, clear the `sunbird-theme`, `sunbird-font`, `sunbird-template`, and `sunbird-layout` keys from `localStorage`.

---

### Behavior Notes

- **Original look preserved** when all defaults are kept (Terracotta + Poppins + Classic + Left Sidebar).
- **Workspace card badges + thumbnail patterns** are theme-reactive — hue-derived from `--sunbird-spark-theme-primary-h` via `--ws-pat-{1..6}-h` tokens, so a theme switch rotates every workspace card colour together.
- **Top / Bottom navbar** background is theme-reactive — driven by `--nav-bg` (chip-tinted in Classic, primary-tinted in Modern).
- **Category gradients on landing page** are FIXED (decorative, not brand identity).
- **Sunbird brand logo, dissolveParticles** stay static (brand identity).
- **All sunbird-* Tailwind utilities, CSS-var-driven components** retint automatically with theme change.

---

### Adding a New Theme — End-to-End Example

Goal: add a **"Sunrise"** colour palette, a **"Sunrise Modern"** theme (uses Sunrise + Inter), and a **"Sky"** template that bundles Sunrise + Poppins + Modern radius:

**1. Add colour palette** — `frontend/src/theme/themes.ts`:

```ts
{ id: 'sunrise', name: 'Sunrise',
  seeds: { primaryH: 24, primaryS: '95%', primaryL: '53%', chipH: 35, chipS: '100%', iconH: 20 } },
```

**2. Add theme** — same file:

```ts
{ id: 'sunrise', name: 'Sunrise Modern', colorId: 'sunrise', fontId: 'inter' },
```

**3. Add template** — same file (widen the `TemplateOption['id']` union first):

```ts
{ id: 'sky', name: 'Sky', description: 'Modern sunrise',
  presetThemeId: 'sunrise', presetFontId: 'poppins' },
```

**4. (Optional) Sky needs custom radius.** Add to `frontend/src/styles/template-overrides.css`:

```css
html[data-template="sky"] {
  --r-sm: 0.125rem;
  --r-md: 0.25rem;
  --r-lg: 0.5rem;
  --r-pill: 0.5rem;
}
```

Restart dev server. Both **Sunrise** swatch and **Sky** template appear in the ThemeSelector. Tap Sky → Sunrise colours + Poppins font + Sky radius applied atomically. User can still override theme or font afterward.

---

### Cross-Repo Coupling — Portal ↔ Keycloak

Portal theming (colour / font / template) is **tightly coupled** with the Keycloak login theme in **`sunbird-spark-installer`**. The Keycloak sign-in and set-new-password pages are a separate app that reads the portal's selection from same-origin `localStorage` (`sunbird-theme`, `sunbird-font`, `sunbird-template`) and applies it from its own catalog.

**If you add a new colour, font, or template to the portal, you MUST mirror it in Keycloak — otherwise it will NOT reflect on the sign-in / new-password pages.** Where to edit:

| Add to portal | Also add to Keycloak | File |
|---|---|---|
| `COLOR_PALETTES` (id + 6 seeds) | `THEME_MAP` (same id + same 6 seeds) | `scripts/keycloak-21.1.2/themes/sunbird/login/template.ftl` |
| `FONTS` (id + family) | `FONT_MAP` (same id + family) + `@font-face`/`@import` the font | `…/login/template.ftl` + `…/login/resources/css/login.css` |
| `TEMPLATES` (id) | `html[data-template="<id>"]` token block (radius/shadow), if it needs its own scale | `…/login/resources/css/login.css` |

After editing Keycloak: bump `styles=css/login.css?v=…` in `…/login/theme.properties` (any new value busts cache), rebuild the Keycloak image, redeploy.

**Unknown ids on Keycloak fall back to defaults** — Classic look, terracotta colour, Rubik font. So a portal-only addition won't break the login page; it just won't theme it.

---

## Prerequisites

- **Node.js**: 24.12.0
- **npm**: Latest version
- **Git**: For version control

### Using Node Version Manager (nvm)

```bash
# Install and use the correct Node.js version
nvm install 24.12.0
nvm use 24.12.0
```

## Project Structure

```
sunbird-portal/
├── .github/                        # CI/CD workflows & GitHub config
│   └── workflows/
│       ├── pull-requests.yml       # PR quality checks
│       └── image-push.yml          # Docker image build & push
├── frontend/                       # React application
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── api/                    # Axios API client & config
│   │   ├── assets/                 # Images, icons, static resources
│   │   ├── auth/                   # AuthContext provider
│   │   ├── components/             # Reusable UI components
│   │   │   ├── auth/               # Auth-related components
│   │   │   ├── collection/         # Collection/course components
│   │   │   ├── common/             # Shared components
│   │   │   ├── content/            # Content display components
│   │   │   ├── content-player/     # Content player wrapper
│   │   │   ├── editors/            # Content editors
│   │   │   ├── explore/            # Explore/search components
│   │   │   ├── home/               # Home page components
│   │   │   ├── landing/            # Landing page components
│   │   │   ├── layout/             # App layout (header, sidebar)
│   │   │   ├── players/            # Media players
│   │   │   ├── profile/            # User profile components
│   │   │   ├── reports/            # Report components
│   │   │   ├── signup/             # Signup flow components
│   │   │   ├── telemetry/          # Telemetry components
│   │   │   ├── ui/                 # Base UI primitives (Radix wrappers)
│   │   │   └── workspace/          # Workspace/content management
│   │   ├── configs/                # App config (i18n, languages, feature flags)
│   │   ├── data/                   # Static/mock data
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Shared libraries & HTTP client
│   │   ├── locales/                # i18n translation files (en, fr, pt, ar)
│   │   ├── pages/                  # Route-level page components
│   │   ├── providers/              # Context providers (i18n, telemetry)
│   │   ├── rbac/                   # Role-based access control
│   │   ├── services/               # Business logic & API services
│   │   ├── styles/                 # Global styles & RTL overrides
│   │   ├── test/                   # Test utilities & setup
│   │   ├── types/                  # TypeScript type definitions
│   │   └── utils/                  # Utility functions
│   ├── eslint.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
├── backend/                        # Express API server
│   ├── src/
│   │   ├── auth/                   # OIDC provider & middleware
│   │   ├── config/                 # Environment config (env.ts)
│   │   ├── controllers/            # Request handlers
│   │   ├── databases/              # Database access layer
│   │   ├── middlewares/             # Express middleware
│   │   ├── models/                 # Data models
│   │   ├── proxies/                # Upstream service proxies
│   │   ├── routes/                 # Route definitions
│   │   ├── services/               # Business logic services
│   │   ├── types/                  # TypeScript types & declarations
│   │   ├── utils/                  # Logger, session store, utilities
│   │   ├── app.ts                  # Express app setup
│   │   └── server.ts               # Server entry point
│   ├── .envExample                 # Environment variable template
│   ├── eslint.config.js
│   ├── tsconfig.json
│   └── package.json
├── docs/                           # Documentation
├── Dockerfile                      # Multi-stage production build
├── sonar-project.properties        # SonarQube configuration
├── CLAUDE.md                       # Claude Code instructions
└── README.md                       # This file
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Sunbird-Spark/sunbird-spark-portal.git
cd sunbird-spark-portal
```

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

> **Note**: `npm install` triggers a **postinstall script** (`copy-assets.js`) that copies Sunbird web component assets (content players, editors, icons) from `node_modules` into `public/assets/`. This runs automatically and is required for content players (PDF, video, ePub, QUML) to render correctly.

#### Available Frontend Scripts

```bash
# Start development server (http://localhost:5173)
npm run dev

# Run tests
npm run test            # Vitest in watch mode
npm run test:run        # Single test run
npm run test:coverage   # Coverage report (70% thresholds)

# Code quality
npm run lint            # Check for linting errors
npm run lint:fix        # Auto-fix linting errors
npm run type-check      # TypeScript type checking (no emit)
npm run format          # Prettier format all files
npm run format:check    # Check formatting (CI)
```

Run a single test file:
```bash
npx vitest run src/path/to/file.test.tsx
```

### 3. Backend Setup

Open a new terminal, navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

#### i. Configure Environment Variables

**Before running the backend**, you must create and configure your `.env` file:

```bash
cd backend
cp .envExample .env
```

**Important**: After copying, edit `backend/.env` and make these changes for local development:

1. **Change `ENVIRONMENT`** from `test` to `local`:
   ```bash
   ENVIRONMENT=local
   ```

2. **Remove or comment out `NODE_ENV`**:
   ```bash
   # NODE_ENV=test  (comment out or delete this line)
   ```

3. **Update other values** with your actual configuration (database credentials, API tokens, etc.)

> **Note**: The `.envExample` file is configured for automated testing (CI/CD). For local development, you must change `ENVIRONMENT=test` to `ENVIRONMENT=local` and remove the `NODE_ENV` variable.

#### Environment Configuration Files

Three files manage environment configuration in the `backend` folder:

- **`backend/.env`** - Your local values (create from `.envExample`)
- **`backend/.envExample`** - Template with required variables
- **`backend/src/config/env.ts`** - TypeScript module with defaults

#### Configuration Types

**Required Variables** - Must be set in `.env`:
- Listed in `.envExample`
- Examples: Database credentials, API tokens, session secrets

**Optional Variables** - Have defaults, don't need to be in `.env`:
- NOT listed in `.envExample`
- Defined only in `env.ts` with default values
- Examples: `PORT`, `SUNBIRD_PORTAL_LOG_LEVEL`

#### Adding New Configuration

**Optional Variable** (has a default):
Add ONLY to `env.ts`:
```typescript
//Optional ENVIRONMENT VARIABLES
NEW_OPTIONAL_CONFIG: env.NEW_OPTIONAL_CONFIG || 'default-value',
```

**Required Variable** (must be configured):
1. Add to `env.ts`:
```typescript
NEW_REQUIRED_CONFIG: env.NEW_REQUIRED_CONFIG || 'fallback-value',
```
2. Add to `.envExample`:
```bash
NEW_REQUIRED_CONFIG=your-value-here
```
3. Add to your `.env` and notify team members

#### Environment Variables Reference

##### Server Configuration

| Variable | Description | Required | Default |
|---|---|---|---|
| `ENVIRONMENT` | Runtime environment (`local`, `test`, `production`) | Yes | `''` |
| `PORT` | Backend server port | No | `3000` |
| `DOMAIN_URL` | Public-facing domain URL of the portal | Yes | `''` |
| `SERVER_URL` | Internal server URL (used for OIDC callbacks, etc.) | Yes | `''` |
| `DEVELOPMENT_REACT_APP_URL` | Frontend dev server URL (used in local/dev mode only) | Yes | `''` |
| `SUNBIRD_PORTAL_LOG_LEVEL` | Winston log level (`debug`, `info`, `warn`, `error`) | No | `debug` |

##### Session Configuration

| Variable | Description | Required | Default |
|---|---|---|---|
| `SUNBIRD_SESSION_SECRET` | Secret key used to sign session cookies | Yes | `default_secret` |
| `SUNBIRD_ANONYMOUS_SESSION_TTL` | Anonymous session time-to-live in milliseconds | No | `60000` |
| `SUNBIRD_PORTAL_SESSION_STORE` | Session store type (`in-memory` or `yugabyte`) | No | `in-memory` |

##### Kong API Gateway

| Variable | Description | Required | Default |
|---|---|---|---|
| `KONG_URL` | Base URL of the Kong API gateway | Yes | `''` |
| `KONG_ANONYMOUS_FALLBACK_TOKEN` | API token for anonymous (unauthenticated) requests | Yes | `''` |
| `KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN` | API token for anonymous device registration | Yes | `''` |
| `KONG_LOGGEDIN_FALLBACK_TOKEN` | API token for authenticated user requests | Yes | `''` |
| `KONG_LOGGEDIN_DEVICE_REGISTER_TOKEN` | API token for authenticated device registration | Yes | `''` |

##### Keycloak / OIDC Authentication

| Variable | Description | Required | Default |
|---|---|---|---|
| `PORTAL_REALM` | Keycloak realm name | Yes | `''` |
| `PORTAL_AUTH_SERVER_CLIENT` | Keycloak client ID for the portal | Yes | `''` |
| `OIDC_ISSUER_URL` | OIDC issuer URL (Keycloak realm endpoint) | Yes | `''` |

##### Google OAuth

| Variable | Description | Required | Default |
|---|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client ID (web) | Yes | `''` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client secret (web) | Yes | `''` |
| `GOOGLE_OAUTH_CLIENT_ID_IOS` | Google OAuth client ID (iOS app) | Yes | `''` |
| `KEYCLOAK_GOOGLE_CLIENT_ID` | Keycloak Google identity provider client ID | Yes | `''` |
| `KEYCLOAK_GOOGLE_CLIENT_SECRET` | Keycloak Google identity provider client secret | Yes | `''` |

##### Mobile Authentication

| Variable | Description | Required | Default |
|---|---|---|---|
| `KEYCLOAK_ANDROID_CLIENT_ID` | Keycloak confidential client ID for Android native auth | Yes | `''` |
| `KEYCLOAK_ANDROID_CLIENT_SECRET` | Keycloak confidential client secret for Android | Yes | `''` |
| `KEYCLOAK_GOOGLE_ANDROID_CLIENT_ID` | Keycloak client ID for Google Sign-In on Android | Yes | `''` |
| `KEYCLOAK_GOOGLE_ANDROID_CLIENT_SECRET` | Keycloak client secret for Google Sign-In on Android | Yes | `''` |

##### Database (YugabyteDB)

| Variable | Description | Required | Default |
|---|---|---|---|
| `SUNBIRD_YUGABYTE_HOST` | YugabyteDB host address | Yes | `''` |
| `SUNBIRD_YUGABYTE_PORT` | YugabyteDB YSQL port | No | `5433` |
| `SUNBIRD_YUGABYTE_YCQL_PORT` | YugabyteDB YCQL (Cassandra-compatible) port | No | `9042` |
| `SUNBIRD_YUGABYTE_DATABASE` | YugabyteDB database name | No | `portal` |
| `SUNBIRD_YUGABYTE_USER` | YugabyteDB username | No | `''` |
| `SUNBIRD_YUGABYTE_PASSWORD` | YugabyteDB password | No | `''` |
| `FORMS_DB_NAME` | Cassandra keyspace for forms data | Yes | `''` |
| `CONTENT_REVIEW_COMMENT_DB_NAME` | Cassandra keyspace for review comments | Yes | `''` |

##### Google reCAPTCHA

| Variable | Description | Required | Default |
|---|---|---|---|
| `GOOGLE_RECAPTCHA_SECRET` | Server-side reCAPTCHA secret key | No | `''` |
| `GOOGLE_RECAPTCHA_VERIFY_URL` | reCAPTCHA verification endpoint | No | `https://www.google.com/recaptcha/api/siteverify` |

##### Upstream Services

| Variable | Description | Required | Default |
|---|---|---|---|
| `LEARN_BASE_URL` | Base URL for the Learner service | No | `http://userorg-service:9000` |
| `KNOWLG_MW_BASE_URL` | Base URL for the Knowledge middleware service | No | `http://knowledge-mw-service:5000` |

#### Available Backend Scripts

```bash
# Start development server with hot reload (http://localhost:3000)
npm run dev

# Run tests
npm run test            # Vitest in watch mode
npm run test:run        # Single test run
npm run test:coverage   # Coverage report

# Code quality
npm run lint            # Check for linting errors
npm run lint:fix        # Auto-fix linting errors
npm run type-check      # TypeScript type checking (no emit)
npm run format          # Prettier format all files
npm run format:check    # Check formatting (CI)
```

### 4. Running Both Services (Development)

Open two terminals:

1. **Terminal 1 (Backend)**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Terminal 2 (Frontend)**:
   ```bash
   cd frontend
   npm run dev
   ```

The Vite dev server proxies API requests (e.g., `/api`, `/portal`, `/action`) to the backend automatically. Access the application at **http://localhost:5173**.

## Application URLs

| Environment | Frontend | Backend API |
|---|---|---|
| Development | http://localhost:5173 | http://localhost:3000 |
| Production | Served by backend | http://localhost:3000 |

## Docker

A multi-stage `Dockerfile` is provided for production deployments:

```bash
# Build the Docker image (COMMIT_HASH is required)
docker build --build-arg COMMIT_HASH=$(git rev-parse --short HEAD) -t sunbird-portal .

# Run the container
docker run -p 3000:3000 --env-file backend/.env sunbird-portal
```

The Dockerfile performs three stages:
1. **Frontend build** — Installs dependencies and builds the React app
2. **Backend build** — Compiles TypeScript and stamps the build hash
3. **Production image** — Copies built assets with production-only dependencies, runs as non-root user

## Testing

Both frontend and backend use **Vitest** as the test framework with a **70% coverage threshold** across branches, functions, lines, and statements.

### Frontend Testing

Uses Vitest + happy-dom + @testing-library/react:

```bash
cd frontend
npm run test            # Watch mode
npm run test:run        # Single run
npm run test:coverage   # With coverage report
```

### Backend Testing

Uses Vitest + supertest for integration tests:

```bash
cd backend
npm run test            # Watch mode
npm run test:run        # Single run
npm run test:coverage   # With coverage report
```

## Code Quality

This project enforces strict code quality standards:

### TypeScript Configuration
- **Strict mode enabled** across both frontend and backend
- **`noUncheckedIndexedAccess`** — always handle potentially-undefined array/object access
- **`noUnusedLocals: true`** in backend
- **Max file length** — 250 lines per file (500 for test files)

### ESLint Rules
- TypeScript-first linting configuration
- Prettier integration for consistent formatting

### Theming (Tailwind CSS + Sunbird Design Tokens)

All styling uses Tailwind CSS utility classes. Custom Sunbird design tokens are defined as CSS variables in `src/index.css` and mapped in `tailwind.config.ts`.

**Colors** — Use `sunbird-*` classes (e.g., `text-sunbird-dark-blue`, `bg-sunbird-yellow`):

| Category | Example tokens |
|---|---|
| Brand | `sunbird-dark-blue`, `sunbird-yellow`, `sunbird-light-blue`, `sunbird-medium-blue` |
| Accent | `sunbird-ginger`, `sunbird-brick`, `sunbird-sunflower`, `sunbird-ivory` |
| Nature | `sunbird-leaf`, `sunbird-forest`, `sunbird-moss`, `sunbird-wave` |
| Dark | `sunbird-ink`, `sunbird-charcoal`, `sunbird-obsidian`, `sunbird-jamun` |
| Status | `sunbird-success-green`, `sunbird-status-completed-*`, `sunbird-status-ongoing-*` |
| Grays | `sunbird-gray-75`, `sunbird-gray-82`, `sunbird-gray-b2`, `sunbird-gray-d0`, etc. |

**Shadows** — `shadow-sunbird-sm`, `shadow-sunbird-md`, `shadow-sunbird-lg`

**Font** — `font-rubik` for Sunbird-branded text

**Dark mode** — Enabled via `class` strategy (add `dark` class to root element)

### Pre-commit Quality Checks
```bash
# Frontend
cd frontend
npm run lint && npm run type-check

# Backend
cd backend
npm run lint && npm run type-check
```

## Code Formatting (Prettier)

This repository uses Prettier to enforce consistent code formatting.

```bash
cd frontend
npm run format       # formats files
npm run format:check # checks formatting (CI)
```

```bash
cd backend
npm run format       # formats files
npm run format:check # checks formatting (CI)
```

## CI/CD Pipeline

The project includes GitHub Actions workflows:

### Pull Request Checks ([.github/workflows/pull-requests.yml](.github/workflows/pull-requests.yml))

Runs on every pull request against Node.js 24.12.0:

| Check | Frontend | Backend |
|---|---|---|
| Lint (ESLint) | Yes | Yes |
| Build | Yes | Yes |
| Test with coverage | Yes | Yes |

### Docker Image Push ([.github/workflows/image-push.yml](.github/workflows/image-push.yml))

Triggers on **git tag pushes** (any tag). Builds the Docker image and pushes it to a container registry.

- **Image tag format**: `tagname_commitsha` (lowercase)
- **Supported registries** (configured via `vars.REGISTRY_PROVIDER`):
  - `gcp` — GCP Artifact Registry
  - `azure` — Azure Container Registry
  - `dockerhub` — Docker Hub
  - Default — GitHub Container Registry (ghcr.io)

### SonarQube

Code quality analysis is configured via `sonar-project.properties`. Coverage reports from both frontend and backend are aggregated for analysis.

## Development Workflow

1. **Create feature branch**: `git checkout -b feature/your-feature-name`
2. **Make changes** following TypeScript strict guidelines
3. **Run quality checks**:
   ```bash
   cd frontend && npm run lint && npm run type-check
   cd ../backend && npm run lint && npm run type-check
   ```
4. **Run tests**:
   ```bash
   cd frontend && npm run test:run
   cd ../backend && npm run test:run
   ```
5. **Commit changes**: Follow conventional commit format (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`)
6. **Create pull request**: CI pipeline will run automatically

## Internationalization (i18n)

### Supported Languages
| Language | Code | Direction | Font |
|---|---|---|---|
| English | `en` | LTR | Rubik |
| French | `fr` | LTR | Rubik |
| Portuguese | `pt` | LTR | Rubik |
| Arabic | `ar` | RTL | Noto Sans Arabic |

### Architecture

- **Library**: i18next + react-i18next
- **Config**: `frontend/src/configs/i18n.ts`
- **Language config**: `frontend/src/configs/languages.ts` (codes, labels, direction, fonts)
- **Locale files**: `frontend/src/locales/{en,fr,pt,ar}.json`
- **Hook**: `useAppI18n()` in `frontend/src/hooks/useAppI18n.ts` — provides `t()`, `changeLanguage()`, `isRTL`, `dir`
- **Storage**: `localStorage('app-language')`

### RTL (Arabic) Support

- `I18nDirectionProvider` (`frontend/src/providers/I18nDirectionProvider.tsx`) sets `dir` attribute on `<html>` and `<body>`, and applies the Arabic font via CSS variable
- RTL-specific CSS overrides are in `frontend/src/styles/rtl.css`

### Keycloak Login Page Integration

Portal and Keycloak share the same origin in production, so they share `localStorage`. The Keycloak theme (`sunbird`) reads `localStorage('app-language')` on page load and sets the `KEYCLOAK_LOCALE` cookie to render login/password pages in the user's selected language.

Key files:
- `useAppI18n.ts` — writes language to `localStorage` on change
- `i18n.ts` — reads language from `localStorage` on init
- Keycloak `template.ftl` — reads `localStorage`, sets `KEYCLOAK_LOCALE` cookie, reloads once

### Mobile App Language Sync

The mobile app opens portal pages (signup, forgot-password) in InAppBrowser, which has a separate `localStorage`. To pass the language:
1. Mobile `AuthWebviewService.ts` appends `?lang=XX` to the URL
2. Portal's `ForgotPassword.tsx` reads the `lang` param on mount and writes to `localStorage`
3. Keycloak `template.ftl` reads `localStorage` and applies the locale

### Adding a New Language
1. Add config to `frontend/src/configs/languages.ts`
2. Create `frontend/src/locales/XX.json` with all translated keys
3. Import and register in `frontend/src/configs/i18n.ts`
4. If RTL, add overrides to `frontend/src/styles/rtl.css`
5. Add mapping in Keycloak `template.ftl` locale JS and create `messages_XX.properties`

---

## Mobile App Integration

The portal serves as both a standalone web application and a backend for the **Sunbird mobile app**. Mobile integration spans two patterns:

1. **Native API endpoints** — Token-based authentication with no server-side sessions, called directly from mobile native code
2. **InAppBrowser pages** — Portal pages (signup, forgot-password) opened inside the mobile app's WebView

### Backend Mobile API Routes

All mobile routes are mounted at `/mobile` (defined in `backend/src/routes/mobileRoutes.ts`, registered in `backend/src/app.ts`):

| Endpoint | Method | Purpose |
|---|---|---|
| `/mobile/keycloak/login` | POST | Native username/password login via Keycloak ROPC grant |
| `/mobile/google/auth/android` | POST | Google Sign-In for Android/iOS using native SDK ID token |
| `/mobile/auth/v1/refresh/token` | POST | Token refresh for whitelisted mobile Keycloak clients |

Key backend files:

| File | Purpose |
|---|---|
| `backend/src/routes/mobileRoutes.ts` | Route definitions |
| `backend/src/controllers/mobileKeycloakController.ts` | Handles native Keycloak username/password login |
| `backend/src/controllers/mobileGoogleController.ts` | Handles Google Sign-In (verifies ID token, finds/creates user) |
| `backend/src/controllers/mobileTokenRefreshController.ts` | Validates client whitelist and refreshes tokens |
| `backend/src/services/mobileAuthService.ts` | Core mobile auth logic (token verification, user management, Keycloak ROPC) |

### Authentication Flows

**Native Login (Keycloak ROPC):**
1. Mobile app sends `emailId` + `password` to `/mobile/keycloak/login`
2. Backend authenticates via Keycloak Resource Owner Password Credentials grant using the Android client
3. Returns `access_token` + `refresh_token` directly (no server session)

**Google Sign-In:**
1. Mobile app authenticates with Google natively and obtains an ID token
2. Mobile app sends the ID token (via `X-GOOGLE-ID-TOKEN` header) + `emailId` to `/mobile/google/auth/android`
3. Backend verifies the Google token with the platform-specific client ID (`GOOGLE_OAUTH_CLIENT_ID` for Android, `GOOGLE_OAUTH_CLIENT_ID_IOS` for iOS)
4. Backend finds or creates the Sunbird user, then creates a Keycloak session via the Google Android client
5. Returns `access_token` + `refresh_token` with `offline_access` scope

**Token Refresh:**
1. Mobile app sends `refresh_token` in the request body to `/mobile/auth/v1/refresh/token`
2. Backend decodes the JWT to identify the issuing Keycloak client and validates it against a whitelist
3. Verifies the caller's bearer token against the echo API
4. Returns new `access_token` + `refresh_token`

### InAppBrowser Pages

The mobile app opens these portal pages inside an InAppBrowser (WebView):

| Page | URL | Purpose |
|---|---|---|
| Sign Up | `/signup` | New user registration |
| Forgot Password | `/forgot-password` | Password reset flow |

**Query parameters** passed by the mobile app:

| Parameter | Example | Purpose |
|---|---|---|
| `client` | `mobileApp` | Signals the request originates from the mobile app |
| `redirect_uri` | `org.sunbird.app://oauth2callback` | App-scheme URL to redirect after success |
| `error_callback` | `<url>` | Redirect target on error |
| `lang` | `fr` | Language code for i18n sync (see [Mobile App Language Sync](#mobile-app-language-sync)) |

**How it works:**
1. Mobile app opens the portal URL with params: `?client=mobileApp&redirect_uri=<app-scheme>&lang=<code>`
2. Portal calls `persistMobileContext()` to save context to `sessionStorage` (survives Keycloak redirects)
3. After the flow completes, portal redirects to the `redirect_uri` (converted to Android `intent://` URL if needed)
4. The `lang` param is applied to i18n on mount so the page renders in the mobile app's language

Key frontend files:

| File | Purpose |
|---|---|
| `frontend/src/utils/forgotPasswordUtils.ts` | Mobile context utilities: `isMobileApp()`, `persistMobileContext()`, `getSafeRedirectUrl()` |
| `frontend/src/pages/forgotPassword/ForgotPassword.tsx` | Forgot password page with mobile language sync and redirect handling |
| `frontend/src/pages/forgotPassword/PasswordResetSuccess.tsx` | Success page with mobile-aware redirect |
| `frontend/src/pages/signup/SignUp.tsx` | Sign up page with mobile context persistence |
| `frontend/src/components/signup/SignUpForm.tsx` | Sign up form with mobile-aware "Already have account?" link |

### Mobile Environment Variables

Mobile auth requires the following environment variables (see [Environment Variables Reference](#environment-variables-reference) for full details):

- `KEYCLOAK_ANDROID_CLIENT_ID` / `KEYCLOAK_ANDROID_CLIENT_SECRET` — Android native Keycloak client
- `KEYCLOAK_GOOGLE_ANDROID_CLIENT_ID` / `KEYCLOAK_GOOGLE_ANDROID_CLIENT_SECRET` — Google Sign-In Keycloak client
- `GOOGLE_OAUTH_CLIENT_ID` — Google OAuth client ID (Android)
- `GOOGLE_OAUTH_CLIENT_ID_IOS` — Google OAuth client ID (iOS)

---

## Troubleshooting

### Common Issues

1. **Node.js version mismatch**: Ensure you're using Node.js 24.12.0
   ```bash
   nvm install 24.12.0
   nvm use 24.12.0
   ```

2. **Port conflicts**:
   - Frontend (5173) and Backend (3000) ports should be available
   - Change ports in [vite.config.ts](frontend/vite.config.ts) or [server.ts](backend/src/server.ts) if needed

3. **TypeScript errors**: Run type check to identify issues
   ```bash
   cd frontend && npm run type-check
   cd ../backend && npm run type-check
   ```

4. **Backend won't start**: Ensure you've created `backend/.env` from `.envExample` and set `ENVIRONMENT=local`

## Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vite.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [Vitest](https://vitest.dev/)

## License

MIT License - see LICENSE file for details.
