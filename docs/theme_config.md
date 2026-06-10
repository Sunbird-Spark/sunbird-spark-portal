# Theme Reactivity Test Plan

## Overview

The Sunbird Spark Portal uses a 6-seed CSS variable system. Changing 6 values in one CSS file rethemes the entire portal. This plan tells anyone — regardless of prior knowledge — exactly what to look at, where to look, and what colour they should see for each theme.

---

## Step 1 — How to Switch Themes

Open `frontend/src/index.css` and find the seed block around line 31. It looks like this:

```css
--sunbird-spark-theme-primary-h: 217; --sunbird-spark-theme-primary-s: 71%; ...
```

Replace the active lines with one of the three presets below, then save. The browser updates instantly — no restart needed.

**Preset A — Terracotta (the default)**
```css
--sunbird-spark-theme-primary-h: 12;  --sunbird-spark-theme-primary-s: 50%;  --sunbird-spark-theme-primary-l: 45%;
--sunbird-spark-theme-chip-h: 45;     --sunbird-spark-theme-chip-s: 100%;
--sunbird-spark-theme-icon-h: 28;
```

**Preset B — Blue**
```css
--sunbird-spark-theme-primary-h: 217; --sunbird-spark-theme-primary-s: 71%;  --sunbird-spark-theme-primary-l: 46%;
--sunbird-spark-theme-chip-h: 217;    --sunbird-spark-theme-chip-s: 71%;
--sunbird-spark-theme-icon-h: 200;
```

**Preset C — Teal**
```css
--sunbird-spark-theme-primary-h: 180; --sunbird-spark-theme-primary-s: 38%;  --sunbird-spark-theme-primary-l: 38%;
--sunbird-spark-theme-chip-h: 180;    --sunbird-spark-theme-chip-s: 38%;
--sunbird-spark-theme-icon-h: 170;
```

Run `npm run dev` from the `frontend/` folder and open `http://localhost:5173`.

**Faster way — runtime switcher:** click the sun icon (☀) in the header next to the language selector. Pick a colour theme or a font from the dropdown. Selection persists in `localStorage`.

---

## Step 2 — How to Read the Test Tables

Each row in the tables below follows this format:

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|

- **What you see on screen** — the exact button label, badge text, icon, or element name as it appears visually
- **Where exactly to look** — precise location so you can find it without guessing
- **Terracotta / Blue / Teal** — the colour it should show for that theme

**Mark a row FAIL** if switching themes does not change the element's colour as described.
**Rows marked [FIXED]** are intentionally hardcoded — they must stay the same across all themes.

---

## Step 3 — Colour Quick Reference

| Theme | Buttons, active links, progress fills | Badge/chip backgrounds | Card tints, consent boxes |
|---|---|---|---|
| Terracotta | Terracotta-red / brick-orange | Warm amber-cream | Very light amber-cream |
| Blue | Medium blue | Light blue | Very light blue |
| Teal | Teal-green | Light teal | Very light teal |

---

## Who Needs to Log In As What

Different sections require different roles. Set up test accounts before starting:

| Role | How to access | What sections it unlocks |
|---|---|---|
| **Guest (not logged in)** | Open the app without logging in | Landing page (`/`) only |
| **Learner** | Log in as a regular user | Home, Explore, My Learning, Profile, Course Detail (enrolled view) |
| **Creator** | Log in as a content creator | Workspace, Batch Management card, Add Certificate modal, Course Dashboard |
| **Mentor** | Log in as a mentor | Course Dashboard (view-only batch tab) |
| **Admin** | Log in as admin | User Management, Admin Reports |

Each scenario below starts with a **"Who to log in as"** line so there is no confusion.

---

---

# S0 — Landing Page (`/`)

**Who to log in as:** Guest — do NOT log in. Open `http://localhost:5173` directly.

---

### S0-A — Header (sticky bar pinned to the top of the page)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 0.1 | Nav links **Home · Explore · About · Contact** | Top bar, centre-left | Terracotta-red text | Blue text | Teal text |
| 0.2 | The **"Log In"** button | Top bar, far right | Terracotta-red filled button | Blue filled button | Teal filled button |

---

### S0-B — Hero Section (the large banner immediately below the header)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 0.3 | The large button labelled **"Start Your Learning Journey"** | Centre of the hero area, below the headline | Terracotta-red button | Blue button | Teal button |
| 0.4 | A small **amber/coloured dot** floating near the top-right of the hero image (desktop only) | Right side of the hero, floating in space | Amber-yellow dot | Blue dot | Teal dot |
| 0.5 | Two smaller **coloured dots** on either side of that amber dot (desktop only) | Left and right of the amber dot | Terracotta-red dots | Blue dots | Teal dots |
| 0.6 | The **round arrow button** in the bottom-right corner of the "Study at your own pace" card (inside the hero stats row) | Bottom-right corner of the rightmost hero card | Terracotta-red circle with white arrow | Blue circle | Teal circle |

---

### S0-C — Hero Stats Row (the three cards sitting below the main hero area)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 0.7 | **Book icon** next to the "500+ Courses" stat | Inside the left stats card | Muted terracotta-toned icon stroke | Muted blue icon | Muted teal icon |
| 0.8 | **Users/people icon** next to the "50K+ Active Learners" stat | Inside the middle stats card | Muted terracotta-toned icon stroke | Muted blue icon | Muted teal icon |
| 0.9 | **Certificate/ribbon icon** next to the "200+ Certifications" stat | Inside the right stats card | Muted terracotta-toned icon stroke | Muted blue icon | Muted teal icon |

---

### S0-D — Dynamic Content Sections (course card grids that appear below the hero)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 0.10 | **"→" arrow link** next to each section heading (e.g. "Browse All") | Top-right of each section's heading row | Terracotta-red text/icon | Blue | Teal |
| 0.11 | **Content type chip/badge** on each course card (e.g. the small label reading "Course" or "Video") | Top-left corner of each course card's thumbnail image | Amber-cream background, terracotta-tinted border | Light-blue background, blue border | Light-teal background, teal border |
| 0.12 | **Person/creator icon** in the bottom stats row of each course card | Bottom section of each card, left of the creator name | Terracotta-red icon | Blue icon | Teal icon |

---

### S0-E — Category Section (4 gradient tiles + "View All" button)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 0.13 | The round **"Browse All"** circle with an arrow icon, with "View All" text label below it | To the right of the 4 category tiles (or below on mobile) | Terracotta-red circle | Blue circle | Teal circle |

> **[FIXED]** The 4 gradient tiles (UI/UX Design, IT Development, Digital Marketing, Entrepreneurship) use decorative fixed gradients and must NOT change with the theme.

---

### S0-F — Resource Centre Section (the section with tall image-background cards)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 0.14 | The **full section background** of the Resource Centre area (the area behind the cards, not the cards themselves) | The wide section containing the masonry-style image cards | Amber-cream tinted background | Light-blue tinted background | Light-teal tinted background |
| 0.15 | **Pulsing skeleton blocks** that briefly appear while the cards are loading | Same section, visible for a second after page load | Amber-cream pulsing rectangles | Light-blue pulsing rectangles | Light-teal pulsing rectangles |

---

### S0-G — FAQ Section (expandable/collapsible question cards)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 0.16 | The **chevron / down-arrow icon** on the right side of each FAQ question | Right edge of each question row | Terracotta-red chevron | Blue chevron | Teal chevron |

---

### S0-H — Footer (dark background bar at the very bottom)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 0.17 | **"Terms and Conditions"** clickable text | Black bottom bar, left-centre | Terracotta-red text | Blue text | Teal text |
| 0.18 | **"Privacy Policy"** clickable text | Black bottom bar, right of Terms | Terracotta-red text | Blue text | Teal text |

> **[FIXED]** Footer dark/black background, headline text, FAQ white card backgrounds, hero illustration — none of these change.

---

---

# S1 — Home Page (`/home`)

**Who to log in as:** Learner (or any logged-in user).

---

### S1-A — Sidebar (left navigation panel, visible on all authenticated pages)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 1.1 | The **active nav item text** (e.g. the word "Home" when you are on the home page) | Left sidebar, the item that is currently highlighted | Terracotta-red text | Blue text | Teal text |
| 1.2 | **Icon of the active nav item** (e.g. the house icon next to "Home") | Left sidebar, icon immediately left of the active item's label | Terracotta-red icon | Blue icon | Teal icon |
| 1.3 | **Icons of inactive nav items** (e.g. the icons next to My Learning, Explore when not on those pages) | Left sidebar, icons next to non-active items | Muted amber-brown icon | Muted blue icon | Muted teal icon |
| 1.4 | The **hamburger/collapse icon** at the top of the sidebar | Top-left of the header bar| Terracotta-red icon | Blue icon | Teal icon |

---

### S1-B — Header (authenticated top bar)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 1.5 | **Chevron icon** inside the Language selector button | Top-right of header, the button showing a flag or language code | Terracotta-red chevron | Blue chevron | Teal chevron |
| 1.6 | **Active language indicator dot** — a small dot next to the currently selected language | Open the language dropdown, look for the small dot next to the selected language | Terracotta-red dot | Blue dot | Teal dot |

---

### S1-C — Stats Cards (4 coloured cards at the top of the page content)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 1.7 | **"Total Courses"** card — entire card background colour | First card (leftmost) | [FIXED] Teal-blue — does NOT change | Same | Same |
| 1.8 | **"In Progress"** card — entire card background colour | Second card | [FIXED] Amber-gold — does NOT change | Same | Same |
| 1.9 | **"In Progress"** card — the small square icon container at the top-right corner of that card | Inside the In Progress card, top-right | [FIXED] Dark brown — does NOT change | Same | Same |
| 1.10 | **"Completed"** card — entire card background colour | Third card | [FIXED] Green-moss — does NOT change | Same | Same |
| 1.11 | **"Certifications Earned"** card — entire card background colour | Fourth card (rightmost) | [FIXED] Lavender — does NOT change | Same | Same |

---

### S1-D — Browse Categories Section

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 1.12 | The round **"View All"** circle with arrow, with "View All" text label below | To the right of or below the 4 category tiles | Terracotta-red circle | Blue circle | Teal circle |

---

### S1-E — Continue Learning Card (appears if you have enrolled courses)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 1.13 | The **circular progress ring** showing course completion percentage | Left area of the Continue Learning card — a small ring with a number inside | Terracotta-red arc on muted amber background track | Blue arc on muted blue track | Teal arc on muted teal track |
| 1.14 | The **"Resume →"** button with an arrow icon | Right side of the Continue Learning card | Terracotta-red button | Blue button | Teal button |

---

### S1-F — Recommended Contents Section

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 1.15 | **"→" arrow icon** next to the "Recommended Contents" section heading | Right side of the section heading row | Terracotta-red icon | Blue icon | Teal icon |
| 1.16 | **Content type chip** on each course card (e.g. small label "Course") | Top-left corner of each card thumbnail | Amber-cream bg, terracotta border | Light-blue bg, blue border | Light-teal bg, teal border |
| 1.17 | **Person/creator icon** in each card's bottom row | Bottom of each card, left of creator name | Terracotta-red icon | Blue icon | Teal icon |

---

---

# S2 — Explore Page (`/explore`)

**Who to log in as:** Learner (or any logged-in user). Click "Explore" in the sidebar.

---

### S2-A — Filters Panel (left side panel)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 2.1 | A **ticked/checked checkbox** next to a filter option | Left filters panel — tick any checkbox | Terracotta-red filled box with white tick | Blue filled box | Teal filled box |
| 2.2 | Filter option text colour **when you hover over it** | Hover your cursor over an unchecked filter label | Turns terracotta-red on hover | Turns blue | Turns teal |

---

### S2-B — Sort Bar (top of the content grid area)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 2.3 | **Chevron/down-arrow icon** inside the "Sort By" dropdown button | Top of the content area, right side, next to the sort label | Terracotta-red chevron | Blue chevron | Teal chevron |

---

### S2-C — Course Cards Grid

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 2.4 | **Content type chip** on each card (e.g. "Course", "Video") | Top-left corner of each card's thumbnail image | Amber-cream bg, terracotta border | Light-blue bg, blue border | Light-teal bg, teal border |
| 2.5 | **Person/creator icon** in each card's bottom stats row | Bottom of each card, left of creator name | Terracotta-red icon | Blue icon | Teal icon |
| 2.6 | **Spinning loading ring** visible when more results are loading (scroll to bottom of results) | Bottom of the grid, below the last card | Terracotta-red spinning ring | Blue ring | Teal ring |

---

---

# S3 — Course Detail Page (`/collection/:id`)

Click any course card to open it. Different users see different things on this page, so the section is split by role.

---

## S3 for Guests (not logged in)

**Who to log in as:** Guest — do NOT log in.

### S3-Guest — Right Side Panel

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 3G.1 | **"Unlock Learning"** card — entire background | Right side of the page, card with a lock message | Amber-cream background | Light-blue background | Light-teal background |
| 3G.2 | **"Unlock Learning"** card border | The border around that card | Amber border | Blue border | Teal border |
| 3G.3 | **"Log In"** button inside the Unlock Learning card | Button inside that card | Terracotta-red button | Blue button | Teal button |

---

## S3 for Learners (not yet enrolled)

**Who to log in as:** Learner without enrolment.

### S3-Learner-NotEnrolled — Right Side Panel

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 3L1.1 | **"Available Batches"** card — entire background | Right panel, card labelled "Available Batches" | Amber-cream background | Light-blue background | Light-teal background |
| 3L1.2 | **"Available Batches"** card border | The border around that card | Amber border | Blue border | Teal border |
| 3L1.3 | Batch selector **dropdown border** | The dropdown inside the Available Batches card | Amber border | Blue border | Teal border |
| 3L1.4 | **"Join"** or **"Enrol"** button | Bottom of the Available Batches card | Terracotta-red button | Blue button | Teal button |

---

## S3 for Learners (enrolled)

**Who to log in as:** Learner who is already enrolled in the course.

### S3-Learner-Enrolled — Left Content Sidebar

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 3L2.1 | **Chevron/expand icon** next to each unit/module name | Right side of each collapsible unit row in the left panel | Terracotta-red chevron | Blue chevron | Teal chevron |
| 3L2.2 | The **active/currently selected lesson row** (highlighted border) | Left panel — the lesson you are currently viewing | Terracotta-red border highlight | Blue border | Teal border |
| 3L2.3 | **"In Progress" exclamation-circle icon** next to a lesson you've started but not finished | Right side of a partially completed lesson row | Terracotta-red icon | Blue icon | Teal icon |

### S3-Learner-Enrolled — Course Progress Card (right panel)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 3L2.4 | **"Course Progress"** card — entire background | Right panel, card showing "Course Progress" and a percentage | Amber-cream background | Light-blue background | Light-teal background |
| 3L2.5 | **"Course Progress"** card border | The border around that card | Amber border | Blue border | Teal border |
| 3L2.6 | The **filled portion of the horizontal progress bar** | The coloured part of the bar inside the Course Progress card | Terracotta-red fill | Blue fill | Teal fill |
| 3L2.7 | **"XX%"** percentage text at the right end of the progress bar | Right end of the progress bar inside the card | Amber-toned text | Blue text | Teal text |

### S3-Learner-Enrolled — Certificate Card (right panel, if course has certificate)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 3L2.8 | **Certificate card background** (when certificate is attached to the course) | Right panel, card with a certificate icon | Amber-cream background | Light-blue background | Light-teal background |
| 3L2.9 | **Certificate card border** | Border around that card | Amber border | Blue border | Teal border |
| 3L2.10 | **Certificate icon box** (small coloured square holding the certificate icon) | Top-left of the certificate card | Light terracotta-tinted square | Light blue square | Light teal square |
| 3L2.11 | **"Preview Certificate"** button | Bottom of the certificate card | Terracotta-red button | Blue button | Teal button |

### S3-Learner-Enrolled — Profile Data Sharing Card (right panel, if course requires it)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 3L2.12 | **Profile data sharing card border** | Border of the profile sharing card in the right panel | Amber border | Blue border | Teal border |
| 3L2.13 | **"Update"** link text | Inside that card, right-aligned | Terracotta-red text | Blue text | Teal text |

### S3-Learner-Enrolled — Rating Dialog (popup after completing a lesson)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 3L2.14 | **Star icons that are filled** (the selected star rating and all stars before it) | The 5-star row inside the rating popup | Terracotta-red filled stars | Blue filled stars | Teal filled stars |
| 3L2.15 | **Empty star icons** (stars not yet selected) | Stars in the rating popup that are not selected | Gray empty stars — [FIXED] | Same | Same |

---

## S3 for Creators / Mentors

**Who to log in as:** Creator or Mentor.

### S3-Creator — Right Panel

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 3C.1 | **"View Course Dashboard"** outline button | Top of the right panel | Terracotta-red text + border | Blue text + border | Teal text + border |

### S3-Creator — Batch Management Card (right panel)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 3C.2 | **Refresh button** (circular arrow icon) | Top-right of the "Manage Batches" card | Terracotta-red border and icon, fills terracotta-red on hover | Blue | Teal |
| 3C.3 | **"+" Create batch button** (plus icon, creator only) | Next to the refresh button | Terracotta-red border and icon, fills on hover | Blue | Teal |
| 3C.4 | **"Ongoing" tab** in the Ongoing / Upcoming / Expired tab bar — active tab text | The tab bar inside the batch card | Terracotta-red text | Blue text | Teal text |
| 3C.5 | **Active tab underline** (the coloured bar below the active tab) | Bottom edge of the active tab | Terracotta-red bar | Blue bar | Teal bar |
| 3C.6 | **Count badge on active tab** (e.g. "3" circle next to tab label) | Inside the tab label | Terracotta-red filled circle with white number | Blue filled circle | Teal filled circle |
| 3C.7 | **Count badge on inactive tabs** | Same badge on non-selected tabs | Gray filled circle — [FIXED] | Same | Same |
| 3C.8 | **"Upcoming"** status badge on a batch row | Right of the batch name in any batch row | Amber-cream background, amber-brown text | Light-blue background, blue text | Light-teal background, teal text |
| 3C.9 | **"Ongoing"** status badge | Right of the batch name | [FIXED] Green background, green text | Same | Same |
| 3C.10 | **"Expired"** status badge | Right of the batch name | [FIXED] Gray background, gray text | Same | Same |
| 3C.11 | **Edit pencil icon** on a batch row (when hovering) | Right side of each editable batch row | Turns terracotta-red on hover | Turns blue | Turns teal |
| 3C.12 | **Calendar icon** in the batch date row | Left of the date range text | Terracotta-red (slightly transparent) | Blue | Teal |
| 3C.13 | **"Add Certificate"** or **"Edit Certificate"** link text | Bottom of each batch row | Terracotta-red text | Blue text | Teal text |
| 3C.14 | **Award/certificate icon** next to the "Add Certificate" link | Left of that link text | Terracotta-red icon | Blue icon | Teal icon |

---

---

# S4 — Add / Edit Certificate Modal

**Who to log in as:** Creator.
**How to reach it:** On the Course Detail page, inside the Batch Management card, click **"Add Certificate"** or **"Edit Certificate"** on any batch row.

---

### S4-A — Modal Header and Tabs

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 4.1 | **Certificate icon (FiAward)** in the modal title row | Top-left of the modal header | Terracotta-red icon | Blue icon | Teal icon |
| 4.2 | **"← Back"** link text (visible when you have navigated deeper inside the modal) | Top-right of the modal header | Terracotta-red text | Blue text | Teal text |
| 4.3 | **"Current Certificate" / "Change Certificate"** tab text for the active tab | Tab bar below the modal header | Terracotta-red active tab text | Blue | Teal |
| 4.4 | **Active tab underline** (coloured line below the selected tab) | Bottom edge of the active tab in the tab bar | Terracotta-red line | Blue line | Teal line |

### S4-B — Certificate Rules / Settings Panel (inside "Change Certificate" tab)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 4.5 | **"+ Add Score Rule"** link text | Below the "Progress Rule" field | Terracotta-red text, underlines on hover | Blue | Teal |
| 4.6 | **Condition consent box background** — the rounded box containing the text "All the elements and attributes are thoroughly verified…" | Middle of the panel, labelled "Condition" | Amber-cream background | Light-blue background | Light-teal background |
| 4.7 | **Condition consent box border** | The border around that box | Amber border | Blue border | Teal border |
| 4.8 | **Condition consent text** — "All the elements and attributes are thoroughly verified…" | Text inside that consent box | Terracotta-red text | Blue text | Teal text |
| 4.9 | **Checkbox border** inside the condition box (unchecked state) | The small square checkbox left of the consent text | Amber border | Blue border | Teal border |
| 4.10 | **Checkbox fill** when ticked | Click the checkbox to tick it | Terracotta-red filled checkbox with white tick | Blue | Teal |
| 4.11 | **Selected template preview box border** (when a template has been chosen) | The dashed rectangle showing the chosen template | Terracotta-red/40 dashed border | Blue dashed border | Teal dashed border |

### S4-C — Template Selection Panel (the grid of certificate thumbnail cards)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 4.12 | **Refresh icon** button | Top-right of the template panel header | Terracotta-red icon + border, fills on hover | Blue | Teal |
| 4.13 | **"+" Create New Template** button | Next to the refresh icon | Terracotta-red icon + border, fills to terracotta-red with white icon on hover | Blue | Teal |
| 4.14 | **"+ Create New Template"** link in the empty state (no templates yet) | Shown in the centre when there are no templates | Terracotta-red text, underlines on hover | Blue | Teal |

### S4-D — Modal Footer Buttons

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 4.15 | **"Add Certificate"** button (with award icon) | Bottom-right of the modal | Terracotta-red button | Blue button | Teal button |
| 4.16 | **"Add Certificate"** button in disabled state (when conditions not yet met) | Same button before checkbox is ticked | Washed-out terracotta (40% opacity) | Washed-out blue | Washed-out teal |

---

---

# S5 — Create Certificate Template Panel

**Who to log in as:** Creator.
**How to reach it:** Inside the Add Certificate modal, click the **"+" Create New Template** button (top-right of template grid).

---

### S5-A — Image Picker Buttons (Brand Logo 1, Brand Logo 2, Signature 1, Signature 2)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 5.1 | Each **"Select image"** button in its default state (no image chosen yet) — text and icon colour **on hover** | The dashed-border rectangular buttons for Brand Logo 1, Logo 2, Signature 1, Signature 2 | Border and text turn terracotta-red on hover | Turn blue | Turn teal |
| 5.2 | Each **"Select image"** button **after an image is chosen** — thumbnail + "Change Image" text colour | Same buttons after you have picked an image | Terracotta-red "Change Image" text, terracotta-red dashed border | Blue | Teal |
| 5.3 | **"Remove"** text link below each image picker after image is chosen | Small red-ish remove link below the picker | Red text — [FIXED] | Same | Same |

### S5-B — Terms Consent Box

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 5.4 | **Terms consent box background** — the box containing "I confirm that all the elements for this certificate…" | Bottom of the form, before the Save button | Amber-cream background | Light-blue background | Light-teal background |
| 5.5 | **Terms consent box border** | Border of that box | Amber border | Blue border | Teal border |
| 5.6 | **Terms consent text** — "I confirm that all the elements for this certificate…" | Text inside that box | Terracotta-red text | Blue text | Teal text |
| 5.7 | **Checkbox** inside the consent box | Small checkbox left of the consent text | Terracotta-red border; fills terracotta-red with white tick when checked | Blue | Teal |

### S5-C — Footer Buttons

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 5.8 | **"Save Template"** button (enabled state) | Bottom-right of the panel | Terracotta-red button | Blue button | Teal button |
| 5.9 | **"Save Template"** button (disabled — before checkbox is ticked) | Same button, greyed out | Washed-out terracotta (40% opacity) | Washed-out blue | Washed-out teal |

---

---

# S6 — Image Picker Dialog (inside Create Template)

**Who to log in as:** Creator.
**How to reach it:** Inside Create Template Panel, click any **"Select image"** button (Brand Logo, Signature, etc.).

---

### S6-A — Dialog Tabs (My Images / All Images / Upload)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 6.1 | **Active tab text** (e.g. "My Images" when selected) | Tab bar below the dialog title | Terracotta-red text | Blue text | Teal text |
| 6.2 | **Active tab underline** | Bottom edge of the selected tab | Terracotta-red line | Blue line | Teal line |

### S6-B — Image Gallery Tab (My Images / All Images)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 6.3 | **Border around the currently selected image** in the grid | The image that is highlighted/selected in the 4-column gallery grid | Terracotta-red solid border | Blue border | Teal border |
| 6.4 | Border around unselected images **on hover** | Hover over any non-selected image | Appears with a light border on hover — [FIXED] gray | Same | Same |
| 6.5 | **"Upload New →"** button in the dialog footer | Bottom of the dialog, right side | Terracotta-red text + border, fills terracotta-red with white text on hover | Blue | Teal |

### S6-C — Upload Tab

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 6.6 | **Drag-and-drop zone border** when you drag a file over it | The upload area in the centre of the dialog when dragging | Terracotta-red border + very light terracotta tint background | Blue border + light blue tint | Teal border + light teal tint |
| 6.7 | **Drag-and-drop zone border on hover** (without dragging, just hovering) | Hover cursor over the dashed upload rectangle | Terracotta-red border on hover | Blue | Teal |
| 6.8 | **"Copyrights and License" box background** — box containing "I understand and confirm that all resources and assets…" | Below the file drop zone | Amber-cream background | Light-blue background | Light-teal background |
| 6.9 | **"Copyrights and License" box border** | Border of that box | Amber border | Blue border | Teal border |
| 6.10 | **"Copyrights and License" text** — "I understand and confirm that all resources…" | Text inside that box | Terracotta-red text | Blue text | Teal text |
| 6.11 | **"Upload & Use"** button (enabled) | Bottom-right of the Upload tab | Terracotta-red button | Blue button | Teal button |
| 6.12 | **"Upload & Use"** button (disabled — before file is chosen) | Same button in greyed-out state | Washed-out terracotta | Washed-out blue | Washed-out teal |

---

---

# S7 — My Learning Page (`/my-learning`)

**Who to log in as:** Learner with at least one enrolled course.

---

### S7-A — Filter Tabs (Active / Completed / Upcoming)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 7.1 | The **active filter tab pill** (e.g. "Active" tab when viewing active courses) — background colour | Row of three pill-shaped tabs at the top of the courses panel | Terracotta-red filled pill | Blue filled pill | Teal filled pill |
| 7.2 | Active tab pill **text colour** | Text inside the filled pill | White text — [FIXED] | Same | Same |
| 7.3 | Inactive tab pill border and text **on hover** | Hover over an unselected tab pill | Terracotta-red border + text on hover | Blue on hover | Teal on hover |

### S7-B — Course Cards in the List

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 7.4 | **Horizontal progress bar fill** — the coloured portion of the bar showing % completion | Bottom area of each course card in the list | Terracotta-red fill | Blue fill | Teal fill |
| 7.5 | **"Show More"** button (appears below the list when there are more courses) | Below the course card list, centred | Terracotta-red text + border; fills terracotta-red with white text on hover | Blue | Teal |

### S7-C — Donut Progress Chart (right panel)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 7.6 | The **card background** of the panel containing the donut ring | Right panel, the entire card area behind the donut chart | Amber-cream background | Light-blue background | Light-teal background |
| 7.7 | **Outer ring stroke** of the donut (the larger/outer circle) | The outer ring of the donut chart | Muted amber-brown stroke | Muted blue stroke | Muted teal stroke |
| 7.8 | **Inner ring stroke** of the donut (the smaller/inner circle) | The inner ring of the donut chart | Dark amber-brown stroke | Dark blue stroke | Dark teal stroke |

### S7-D — Upcoming Batches Panel (right panel)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 7.9 | **Book/lesson-count icon** inside each upcoming batch item | Left side of each batch item row | Terracotta-red icon | Blue icon | Teal icon |
| 7.10 | **Even-numbered batch item background** (1st, 3rd, 5th… items) | Every other batch card in the upcoming batches list | Ultra-light terracotta tint background | Ultra-light blue tint | Ultra-light teal tint |

---

---

# S8 — Profile Page (`/profile`)

**Who to log in as:** Learner (any logged-in user).

---

### S8-B — Profile Card (left column)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 8.3 | **Ring border** around the profile photo | The circular coloured ring enclosing your profile photo | Muted terracotta ring | Muted blue ring | Muted teal ring |

### S8-C — Personal Information Card (right column)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 8.5 | The short **vertical accent bar** on the left edge of the "Personal Information" heading | A thin coloured vertical strip to the left of the section title text | Muted terracotta bar | Muted blue bar | Muted teal bar |
| 8.6 | **"Edit"** link/button text | Top-right of the Personal Information card | Terracotta-red text | Blue text | Teal text |

### S8-D — Edit Profile Dialog (click "Edit" to open)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 8.7 | **✕ Close button icon** | Top-right corner of the Edit Profile modal | Terracotta-red icon | Blue icon | Teal icon |
| 8.8 | **Input field border when focused** (click into any field like First Name, Email) | Any form input inside the modal while it has cursor focus | Muted terracotta-toned border highlight | Muted blue highlight | Muted teal highlight |
| 8.9 | **"Validate"** link text next to an email or phone field | Right side of the email or phone input, small text link | Terracotta-red text | Blue text | Teal text |
| 8.10 | **"Save"** button | Bottom of the dialog | Terracotta-red button | Blue button | Teal button |

### S8-E — My Learning List (bottom section of the profile page)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 8.11 | The short **vertical accent bar** on the left edge of "My Learning" heading | Thin coloured strip left of the "My Learning" section title | Muted terracotta bar | Muted blue bar | Muted teal bar |
| 8.12 | **Chevron icon** inside the filter dropdown button | Right side of the "Filter:" dropdown button | Terracotta-red chevron | Blue chevron | Teal chevron |
| 8.13 | Dropdown item text and icon **on hover** (All, Not Started, Ongoing, Completed) | Inside the opened filter dropdown, hover over any item | Muted terracotta text on hover | Muted blue | Muted teal |
| 8.14 | **"Ongoing" status badge** on a course row — background | The amber/tinted pill badge reading "Ongoing" next to a course in the list | Amber-cream background | Light-blue background | Light-teal background |
| 8.15 | **"Ongoing" status badge** on a course row — text colour | The text inside that pill | Amber-brown text | Dark-blue text | Dark-teal text |
| 8.16 | **Progress ring arc** (the filled coloured portion of the circular ring) | Left side of each course row — a small SVG ring with a percentage | Terracotta-red arc | Blue arc | Teal arc |
| 8.17 | **Progress ring background track** (the unfilled portion of the ring) | Same ring, the faint circle behind the arc | Very light amber tint track | Very light blue tint track | Very light teal tint track |
| 8.18 | **"View More Courses"** button (appears when more than 5 courses are enrolled) | Below the course list, centred | Terracotta-red text | Blue text | Teal text |

---

---

# S9 — Workspace Page (`/workspace`)

**Who to log in as:** Creator or Reviewer. Click "Workspace" in the sidebar.

---

### S9-A — Toolbar (top bar)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 9.1 | **"+ Create"** button | Top-right of the page | Terracotta-red button | Blue button | Teal button |
| 9.2 | **Active segment text** in the tab bar (e.g. "My Content") | Row of tab segments below the toolbar — the selected one has white background | Terracotta-red text | Blue text | Teal text |
| 9.3 | Inactive segment text **on hover** | Hover over any unselected segment tab | Turns terracotta-red on hover | Turns blue | Turns teal |
| 9.4 | **"Creator"** or **"Reviewer"** active role text | Top-left of the toolbar, small role switcher | Terracotta-red bold text | Blue | Teal |

### S9-B — Create Content Options (click "+ Create")

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 9.5 | **Welcome banner background gradient** (the banner at the top of the Create Options screen) | Top of the create options page | Very light terracotta-tinted gradient | Very light blue-tinted gradient | Very light teal-tinted gradient |
| 9.6 | **Welcome banner border** | Thin border around that banner | Muted terracotta border | Muted blue | Muted teal |
| 9.7 | Content option button **title text on hover** (e.g. "Course", "Content", "Quiz") | Hover over any option button in the grid | Turns terracotta-red on hover | Turns blue | Turns teal |

### S9-C — Content Cards (grid view)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 9.8 | **"Review"** status badge on a content card | Top-left of any card with "Review" status | Amber-cream background, terracotta text, muted terracotta dot | Light-blue bg, blue text, blue dot | Light-teal bg, teal text, teal dot |
| 9.9 | **"Processing"** status badge on a content card | Top-left of any card with "Processing" status | Same as "Review" above | Same | Same |
| 9.10 | **eTextbook / Textbook card thumbnail background** (coloured background when no image exists) | Thumbnail area of a Textbook-type content card | Amber-cream chip tint | Light-blue chip tint | Light-teal chip tint |
| 9.11 | **Loading spinner** when more cards are being fetched (scroll to bottom) | Bottom of the card grid | Terracotta-red spinner | Blue spinner | Teal spinner |

### S9-D — Content List View (click the list view icon to switch)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 9.12 | **"Review"** status badge in the Status column of a list row | Status column, any row with Review status | Same as card view | Blue | Teal |
| 9.13 | List row background **on hover** | Hover over any content row in the list | [FIXED] Light gray (`bg-gray-50`) — does NOT change | Same | Same |

---

---

# S10 — Course Dashboard (`/collection/:id/dashboard/batches`)

**Who to log in as:** Creator or Mentor.
**How to reach it:** On the Course Detail page, click **"View Course Dashboard"** in the right panel.

---

### S10-A — Page Header

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 10.1 | **"← Back to Course Page"** link text and arrow icon | Top of the dashboard page | Terracotta-red text + icon | Blue | Teal |

### S10-B — Tab Bar (Batches / Certificates)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 10.2 | **Active tab text** (e.g. "Batches" when on the Batches tab) | Inside the dashboard card's tab bar | Terracotta-red text | Blue text | Teal text |
| 10.3 | **Active tab underline** | Thin coloured line below the active tab | Terracotta-red line | Blue line | Teal line |

### S10-C — Batches Tab

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 10.4 | **"Upcoming"** status badge inside the batch selector dropdown options | Open the "Choose batch to view report" dropdown — look for Upcoming labelled batches | Amber-cream bg, amber-brown text | Light-blue bg, blue text | Light-teal bg, teal text |

### S10-D — Certificates Tab

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 10.5 | **"Search"** button next to the "Enter Sunbird ID" input | Right of the search input on the Certificates tab | Terracotta-red button | Blue button | Teal button |
| 10.6 | **Award icon** in the Batch Name column (shown when a batch has a certificate) | Inside the results table, Batch Name column | Terracotta-red icon | Blue icon | Teal icon |
| 10.7 | **"Reissue"** link text in the Action column | Action column in the results table, for eligible rows | Terracotta-red link text | Blue | Teal |

### S10-E — Re-issue Certificate Confirmation Dialog

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 10.8 | **"Yes"** button in the "Re-issue Certificate?" confirmation dialog | The confirmation popup's right button | Terracotta-red button | Blue button | Teal button |

---

---

# S11 — Global Search Modal

**Who to log in as:** Any logged-in user.
**How to reach it:** Click the **magnifying glass (search) icon** in the top header on any authenticated page.

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 11.1 | **Magnifying glass icon** inside the search input box | Left side of the search input at the top of the modal | Terracotta-red icon | Blue icon | Teal icon |
| 11.2 | **"Cancel"** text button | Right of the search input | Terracotta-red text | Blue text | Teal text |
| 11.3 | **Content type chip** on each result card (e.g. "Course", "Video") | Top-left corner of each result card's thumbnail | Amber-cream bg, terracotta border | Light-blue bg, blue border | Light-teal bg, teal border |
| 11.4 | **Person/creator icon** in the bottom row of each result card | Bottom of each card, left of the creator name | Terracotta-red icon | Blue icon | Teal icon |
| 11.5 | **"View all results →"** link | Below the results grid | Terracotta-red text | Blue text | Teal text |

---

---

# S12 — Authentication Pages

**Who to log in as:** Guest — do NOT be logged in.

> **Note:** The login form is handled by Keycloak (external) and does NOT react to theme changes. Only the Sign Up and Forgot Password pages are part of this portal.

### S12-A — Sign Up Page (`/signup`)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 12.4 | **"Sign Up"** submit button | Main action button on the sign-up form | Terracotta-red button | Blue button | Teal button |
| 12.5 | Input border **when focused** | Any input field while it has focus | Muted terracotta glow | Muted blue | Muted teal |

### S12-C — Forgot Password / OTP Pages

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 12.6 | Each **OTP digit input box border** when active | The individual single-digit boxes on the OTP entry screen | Terracotta-red active border | Blue | Teal |
| 12.7 | **"Verify"** or **"Submit"** button | Main action button on the OTP / reset page | Terracotta-red button | Blue button | Teal button |

---

---

# S13 — Dropdowns and Popovers (test on any authenticated page)

---

### S13-A — Profile / Avatar Dropdown (click your avatar or name in the top-right header)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 13.1 | **Dropdown panel background** | The floating white panel that appears | Ultra-light amber-cream tint | Ultra-light blue tint | Ultra-light teal tint |
| 13.2 | A menu item's background **on hover** (e.g. hover over "Profile" or "Log Out") | Hover over any item inside the dropdown | Light amber tint on hover | Light blue tint | Light teal tint |
| 13.3 | **Active page indicator dot** (small dot next to the item for the current page) | Small coloured dot to the left of the active menu item | Terracotta-red dot | Blue dot | Teal dot |

### S13-B — Notification Popover (click the bell icon in the header)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 13.4 | **Notification panel background** | The floating panel that opens | Ultra-light amber-cream tint | Ultra-light blue tint | Ultra-light teal tint |
| 13.5 | **Unread notification card border** | The coloured border around unread notification cards inside the panel | Muted terracotta border | Muted blue border | Muted teal border |
| 13.6 | **Delete / trash icon** on each notification card | Right side of each notification card | Terracotta-red icon | Blue icon | Teal icon |

### S13-C — Language Selector Dropdown (click the language/flag button in the header)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 13.7 | **Active language indicator dot** | Small dot to the left of the currently selected language | Terracotta-red dot | Blue dot | Teal dot |

---

---

# S14 — User Management Page

**Who to log in as:** Admin. Navigate to **User Management** via the sidebar (only visible to Admins).

The page has two tabs: **Change User Roles** and **User Consent**.

---

### S14-A — Page-Level Tab Bar

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 14.1 | **Active tab text** (e.g. "Change User Roles" when selected) | The two tabs at the top of the page | Terracotta-red text | Blue text | Teal text |
| 14.2 | **Active tab bottom border** (the underline beneath the selected tab) | Bottom edge of the active tab | Terracotta-red line | Blue line | Teal line |
| 14.3 | Inactive tab text **on hover** | Hover over the unselected tab | Turns terracotta-red | Turns blue | Turns teal |

---

### S14-B — Change User Roles Tab

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 14.4 | **Role badge chips** on each user row (e.g. "Content Creator", "Course Mentor") | Inside the role assignments table, the coloured pill for each role | Amber-cream bg, terracotta border | Light-blue bg, blue border | Light-teal bg, teal border |
| 14.5 | **"No organisations found"** hint text (shown when a user has no orgs assigned) | Below the search result, small hint text | Terracotta-red text | Blue text | Teal text |
| 14.6 | **Terms link** text inside the role assignment dialog (e.g. "Terms and Conditions" inline link) | Inside the role dialog, the clickable terms text | Terracotta-red text | Blue text | Teal text |

---

### S14-C — User Consent Tab (click the "User Consent" tab to switch)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 14.7 | **"Total Users"** summary card — entire background | Top of the User Consent tab, leftmost summary card | [FIXED] Dark teal-blue (`--sunbird-ink`) — does NOT change | Same | Same |
| 14.8 | **"Consent Granted"** summary card — entire background | Second summary card | [FIXED] Moss-green (`--sunbird-moss`) — does NOT change | Same | Same |
| 14.9 | **"Consent Revoked"** summary card — entire background | Third summary card | [FIXED] Lavender (`--sunbird-lavender`) — does NOT change | Same | Same |
| 14.10 | **Sortable column header text on hover** (e.g. "User Name ↑") | Table column headers — hover over any sortable column | Turns terracotta-red on hover | Turns blue | Turns teal |
| 14.11 | **Table row hover background** | Hover over any data row in the consent table | Very light muted tint | Same | Same |
| 14.12 | **Search input border** | The search/filter input above the consent table | Neutral border — [FIXED] does NOT change | Same | Same |
| 14.13 | **"Export CSV"** button | Top-right of the consent table | Terracotta-red border + text (outline button) | Blue | Teal |

---

---

# S15 — Reports Pages

There are two distinct report routes. Test each separately.

---

## S15-A — User Report (`/reports/user/:userId` or via sidebar "Reports")

**Who to log in as:** Any logged-in user. The report shows that user's own learning data.

### S15-A-1 — Summary Cards (top row)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 15.1 | **"Total Courses"** card — entire background | Leftmost card in the summary row | [FIXED] Wave-teal green — does NOT change | Same | Same |
| 15.2 | **"Courses Completed"** card — entire background | Second card | [FIXED] Moss-green — does NOT change | Same | Same |
| 15.3 | **"Courses Pending"** card — entire background | Third card | Muted terracotta-toned background | Muted blue background | Muted teal background |
| 15.4 | **"Certificates Issued"** card — entire background | Fourth card | [FIXED] Dark teal-blue — does NOT change | Same | Same |
| 15.5 | **"Assessments Completed"** card — entire background | Fifth card | [FIXED] Lavender — does NOT change | Same | Same |

### S15-A-2 — Course Progress Table

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 15.6 | **"Completed"** status badge on a course row | Status column, any completed course row | Terracotta-red filled badge | Blue filled badge | Teal filled badge |
| 15.7 | **"In Progress"** status badge | Status column, any in-progress course | Chip-tinted badge (amber-cream bg) | Light-blue chip bg | Light-teal chip bg |
| 15.8 | **"Not Started"** status badge | Status column, any not-started course | Outline-style badge — [FIXED] neutral | Same | Same |
| 15.9 | **Progress bar fill** in each course row | The coloured horizontal bar in the Progress column | Terracotta-red fill | Blue fill | Teal fill |
| 15.10 | **Sortable column header on hover** | Hover over any sortable column header | Turns terracotta-red | Turns blue | Turns teal |
| 15.11 | **Table row background on hover** | Hover over any data row | Very light muted tint | Same | Same |

### S15-A-3 — Assessment History Table

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 15.12 | **"Completed"** certificate badge | Certificate column in assessment table | Terracotta-red filled badge | Blue | Teal |
| 15.13 | **"Pending"** certificate badge | Certificate column for pending entries | Chip-tinted badge | Light-blue | Light-teal |

---

## S15-B — Platform Reports (`/reports/platform`)

**Who to log in as:** Admin only. Navigate via the sidebar (visible to Admins only).

### S15-B-1 — Summary Cards (top row)

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 15.14 | **"Total Users"** card — entire background | Top of platform reports, leftmost card | [FIXED] Dark teal-blue — does NOT change | Same | Same |

### S15-B-2 — Course Completion Table Badges

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 15.15 | **Completion % badge — high (70%+)** | Completion % column, any row with high completion | Terracotta-red filled badge | Blue | Teal |
| 15.16 | **Completion % badge — medium (40–70%)** | Same column, medium completion rows | Chip-tinted secondary badge (amber-cream) | Light-blue | Light-teal |
| 15.17 | **Completion % badge — low (<40%)** | Same column, low completion rows | [FIXED] Red destructive badge — does NOT change | Same | Same |
| 15.18 | **Sortable column header on hover** | Hover over any sortable table column | Turns terracotta-red | Turns blue | Turns teal |

### S15-B-3 — Charts

| # | What you see on screen | Where exactly to look | Terracotta | Blue | Teal |
|---|---|---|---|---|---|
| 15.19 | **"Content by Status" pie chart** — the coloured segments | The pie/donut chart in the Content section | Multiple fixed colours (teal-blue, moss-green, lavender) — [FIXED] | Same | Same |
| 15.20 | **"Content by Type" bar chart** — all bars | The bar chart showing content counts by type | [FIXED] Teal-blue bars (`--sunbird-ink`) | Same | Same |
| 15.21 | **"Top Creators" bar chart** — all bars | The bar chart showing top content creators | Muted terracotta bars | Muted blue bars | Muted teal bars |
| 15.22 | **"User Growth Trend" line** — the line drawn across the chart | The line chart showing user registration trend | Muted terracotta line | Muted blue line | Muted teal line |

---

---

# S16 — Font Family Switcher (Global)

The font is controlled at the **root level** via the `--app-font-family` CSS variable on `<html>`. All `font-rubik` Tailwind classes resolve through this variable, so switching the font retypes the entire app at once. **Per-page testing is not needed** — verify once on a representative page and the rest follow automatically.

**How to switch:** click the sun icon (☀) in the header → **Font** section of the dropdown → pick Poppins / Rubik / Satisfy. Selection persists in `localStorage` under `sunbird-font`.

### S16-A — Global Font Application (verify on any page after switching)

| # | What you see on screen | Where to look | Poppins (default) | Rubik | Satisfy |
|---|---|---|---|---|---|
| 16.1 | **All body text** | Any paragraph, list item, table cell anywhere | Geometric sans (Poppins) | Rounded sans (Rubik) | Cursive (Satisfy) |
| 16.2 | **All headings** (h1–h6) | Page titles, section headings | Geometric sans (Poppins) | Rounded sans (Rubik) | Cursive (Satisfy) |
| 16.3 | **Buttons and CTAs** | "Start Your Learning Journey", "Login", "Continue", etc. | Geometric sans (Poppins) | Rounded sans (Rubik) | Cursive (Satisfy) |
| 16.4 | **Navigation links** | Header nav, sidebar items | Geometric sans (Poppins) | Rounded sans (Rubik) | Cursive (Satisfy) |
| 16.5 | **Form fields** (labels, inputs, placeholders) | Login form, signup form, search bar | Geometric sans (Poppins) | Rounded sans (Rubik) | Cursive (Satisfy) |

### S16-B — What Stays Fixed (NOT Font-Reactive)

| What | Why |
|---|---|
| **Code blocks / monospace text** | Use system monospace stack — must stay readable as code |
| **Arabic / RTL text** | Uses `Noto Sans Arabic` from `I18nDirectionProvider` — language-specific font, not controlled by `--app-font-family` |
| **Icon glyphs** (react-icons) | SVG icons — no text rendering |
| **Logo SVG** | Vector path, not a font glyph |

### S16-C — Quick Smoke Test for Fonts

1. Open `/home` (any logged-in page)
2. Click sun icon → switch to **Rubik** — entire page reflows in Rubik
3. Switch to **Satisfy** — entire page becomes cursive (intentionally hard-to-read, demo of full coverage)
4. Switch back to **Poppins** — restored to default
5. Hard refresh (Cmd+R) — selection persists across reload via localStorage
6. Open `/` (logged out) — font selector also available in public header for guests

**Pass criteria:** font change is instant, applies everywhere (no element keeps the previous font), and survives a reload.

---

# Known Gaps — Intentionally NOT Theme-Reactive

These are hardcoded by design. They MUST stay the same across all three themes.

| What you see | Where | Why it stays fixed |
|---|---|---|
| **"In Progress"** stat card — amber-gold background | Home page and Profile page | User decision: fixed brand identity |
| **"In Progress"** stat card — dark brown icon square | Inside the In Progress card, top-right | User decision: matches fixed amber card |
| **"Total Courses"** stat card — teal-blue background | Home and Profile stats row | Static palette per card identity |
| **"Completed"** stat card — green-moss background | Home and Profile stats row | Static palette |
| **"Certifications"** stat card — lavender background | Home and Profile stats row | Static palette |
| **"Ongoing"** batch status badge — green background, green text | Batch rows in Course Detail and Course Dashboard | Semantic "currently active" colour |
| **"Expired"** batch status badge — gray background, gray text | Batch rows | Semantic "inactive" colour |
| Category tiles gradients (UI/UX, IT Dev, Digital Marketing, Entrepreneurship) | Home and Landing page category sections | Decorative fixed gradients, not brand identity |
| Empty star icons (rating dialog) | The 5-star rating popup | Semantic unfilled state |
| "Remove" link below image pickers | Create Template panel | Semantic destructive action (red) |

---

# Remaining Optional Work — Not Yet Theme-Reactive

These still use hardcoded Tailwind amber classes for semantic "warning/caution" states.
They can be left as-is, or moved to `--sunbird-warning-*` tokens in a future pass.

| File | What you see | Current colour |
|---|---|---|
| `BatchFormFields.tsx` | Warning text when a batch date is missing | `text-amber-600` |
| `CourseCompletionDialog.tsx` | Icon and text inside the course completion dialog | `text-amber-600 / text-amber-700` |
| `BatchExpiryDialog.tsx` | Warning icon background + text in the batch expiry alert | `bg-amber-100 text-amber-600 text-amber-700` |
| `ModalStatusOverlay.tsx` | Icon background in the "template created" state of the certificate status overlay | `bg-amber-100 text-amber-600` |
| `WorkspaceContentCard.tsx` | "Locked" badge on a content card thumbnail | `bg-amber-100 text-amber-700` |
| `WorkspaceContentList.tsx` | Status label text in list view for locked/amber states | `text-amber-600` |

---

# Quick Smoke Test (5 minutes per theme)

Switch seed in `index.css` → save → browser updates instantly.

1. `/` (not logged in) — check the **"Start Your Learning Journey"** button and **"Log In"** button
2. `/home` — check sidebar active item icon, **"View All"** circle, Continue Learning progress ring
3. `/explore` — check a ticked filter checkbox, the card content type chips
4. Any `/collection/:id` — check the Available Batches card background, the progress bar fill, a batch row "Upcoming" badge
5. Certificate modal (creator) — check the condition consent box background and text colour
6. `/my-learning` — check the active tab pill, donut chart outer + inner ring, progress bar fill on cards
7. `/profile` — check **In Progress card stays amber-gold**, avatar ring, Edit button
8. `/workspace` (creator) — check "Review" badge colour, the "+ Create" button
9. `/user-management` (admin) — check active tab underline, role badge chips, "Export CSV" outline button
10. `/reports/user/:id` (any user) — check progress bar fill, "Completed" badge, "In Progress" badge
11. `/reports/platform` (admin) — check "Top Creators" bar colour, completion % high badge, "User Growth Trend" line
12. Any dropdown (avatar top-right) — check the panel background is white (not tinted), active indicator dot colour
13. **Font switcher** — click sun icon → switch to **Rubik** then **Satisfy** — verify entire page (header, body, buttons, sidebar) retypes instantly. Reload to confirm persistence.
