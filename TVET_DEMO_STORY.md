# TVET Learning Path — Demo Story

## Setting

| | |
|---|---|
| **Institution** | Sanketika Vocational Institute |
| **Trade** | Plumbing |
| **Admin persona** | Admin — Training Coordinator |
| **Learner persona** | User — Student enrolled in Plumbing program |

---

## Act 1 — Admin Sets Up the Learning Path (Admin Flow)

> *As a training coordinator, Admin needs to structure the Plumbing curriculum into a progressive, level-based journey so students know exactly where they stand.*

### Step 1 — Navigate to Frameworks

Admin logs in as Admin → goes to **Workspace → Frameworks / Learning Paths** → clicks **"Create Framework"**.

### Step 2 — Define the Trade

Admin fills in:
- **Trade**: Plumbing
- **Framework Name**: Plumbing Journey
- **Category**: Engineering Studies

### Step 3 — Build the Levels

Admin adds 3 levels with duration in **weeks**:

| Level | Name | Duration |
|---|---|---|
| L1 | Fundamentals | 4 Weeks |
| L2 | Intermediate Pipe Work | 6 Weeks |
| L3 | Advanced Hydraulics | 8 Weeks |

Admin adds topics/content to each level — videos, readings, assessments.

### Step 4 — Review & Publish

The Review screen shows a clean summary:
- Level cards with duration in **Weeks** (not hours)
- Total: **18 Weeks**
- No "Topic Types" clutter — just the essentials
- Admin clicks **Publish**

> *In minutes, Admin has structured a complete 18-week Plumbing journey that will appear on every enrolled student's home screen.*

---

## Act 2 — User Sees His Journey (Learner Flow)

> *User logs in the next morning. His home screen now reflects the structured path Admin just published.*

### Step 1 — Stats at a Glance

User sees 5 stat cards at the top of his home screen:

| Card | Value | Note |
|---|---|---|
| Total Courses | 08 | |
| In Progress | 03 | |
| Completed | 02 | |
| Certifications | 01 | |
| **Learning Paths** | **02** | New — he's been assigned the Plumbing framework |

### Step 2 — My Plumbing Learning Path Journey

Below the stats, a dedicated section shows his progress in the Plumbing framework:

```
My Plumbing Learning Path Journey

┌─────────────────────────────────────────────────────────┐
│  Plumbing Journey                  [Engineering Studies] │
│                                                          │
│  ✓ ──────────────── ◉50% ──────────────── 🔒            │
│  Level 1             Level 2              Level 3        │
│  (green)         (progress ring)          (locked)       │
│                                                          │
│  CURRENT PROGRESS                                        │
│  Currently in L2 · 4 of 8 topics complete               │
│                                           [View Roadmap] │
└─────────────────────────────────────────────────────────┘
```

**What each state means:**

| State | Visual | Meaning |
|---|---|---|
| Level 1 | Green circle with ✓ | Completed |
| Level 2 | Brick-coloured 50% progress ring | In progress — 4 of 8 topics done |
| Level 3 | Gray lock icon | Locked — unlocks after L2 is complete |

### Step 3 — Continue Learning

Just below, the "Continue from where you left" card shows User's ongoing course — **Auditing and Finance at 33%** — with the same brick progress ring style, maintaining visual consistency across the page.

> *User now has full visibility: what he's completed, where he is, and what's coming next — all on one screen.*

---

## Key Demo Talking Points

| What to highlight | Why it matters |
|---|---|
| Duration shows **Weeks** not Hours | Matches how TVET programs are actually scheduled |
| Progress ring matches across sections | Consistent design language — learner immediately recognises the visual |
| Green = completed, Brick ring = in-progress, Lock = upcoming | Intuitive status at a glance, no legend needed |
| Learning Paths stat card = 02 | Learner knows they're on a structured path, not just loose courses |
| Admin sees no TVET journey section | Admins manage paths, they don't consume them — clean role separation |

---

## Changes Delivered

### Admin Side
- **Step 4 Review**: Duration now displays in **Weeks** (removed the `× 40` hours conversion)
- **Step 4 Review**: Removed the "Topic Types" legend card from the right sidebar

### Learner Home Page
- **5th stat card**: "Learning Paths" (dark teal, mock value 02)
- **My [Trade] Learning Path Journey section**: Level stepper with completed / in-progress / locked states
- **Circular progress ring** on the in-progress level node (matches the Continue Learning card style)
- **Section hidden for admin users** via `useIsAdmin()` hook
