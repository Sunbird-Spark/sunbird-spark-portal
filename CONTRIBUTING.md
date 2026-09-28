<!-- omit in toc -->
# Sunbird Portal Contributing Guide

First off, thanks for taking the time to contribute! ❤️

This repository is the **Sunbird Spark Portal** — a monorepo holding two applications: a React 19 + TypeScript + Vite frontend, and an Express 5 + TypeScript backend. In production the backend serves the frontend's static build; in development they run separately and Vite proxies to the backend.

The general contribution process is the same across the [Sunbird Spark organisation](https://github.com/Sunbird-Spark). Everything below is specific to this repository.

<!-- omit in toc -->
## Table of Contents

<!-- - [Code of Conduct](#code-of-conduct) -->
- [I Have a Question](#i-have-a-question)
- [I Want To Contribute](#i-want-to-contribute)
  - [Before You Start](#before-you-start)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Improving The Documentation](#improving-the-documentation)
- [Contribution Standards](#contribution-standards)
  - [Using AI Tools](#using-ai-tools)
- [Styleguides](#styleguides)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [What Happens After You Submit](#what-happens-after-you-submit)

<!-- ## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold it. Report unacceptable behaviour to TODO_CONTACT_EMAIL.

Before uncommenting: add CODE_OF_CONDUCT.md to this repository and replace TODO_CONTACT_EMAIL. -->

## I Have a Question

Check the [README](README.md) first — it covers architecture, the theming system, setup and testing in detail. Then search existing [Issues](https://github.com/Sunbird-Spark/sunbird-spark-portal/issues) and [Discussions](https://github.com/orgs/Sunbird-Spark/discussions).

If you still need help, open a thread in [Discussions](https://github.com/orgs/Sunbird-Spark/discussions). Include your Node version, which side you're working on (frontend or backend), and the exact error.

## I Want To Contribute

> When contributing to this project, you must agree that you have authored 100% of the content, that you have the necessary rights to the content, and that the content you contribute may be provided under the project licence.

### Before You Start

Create a copy of, and fill in, the [**Sunbird Contribution Checklist**](https://docs.google.com/spreadsheets/d/1k0x3NEBvQAAEAm6WZzG3RqmzNnX9U8ywABjc4pKfttg/edit?usp=sharing). Share the filled-in copy with the maintainer so you're aligned before you write code.

**When it's needed:** for features, bug fixes with code changes, and anything touching APIs, schemas or configuration. Small documentation edits, typo fixes and single-line corrections don't need one — open the PR and describe what you changed.

### Reporting Bugs

Before reporting, make sure you're on Node 24.12.0 and the latest version of the branch, and search the [issue tracker](https://github.com/Sunbird-Spark/sunbird-spark-portal/issues?q=label%3Abug).

> Never report security issues publicly. Use the **Security → Report a vulnerability** tab, and give maintainers a reasonable window to fix and release before disclosing.

[Open a bug report](https://github.com/Sunbird-Spark/sunbird-spark-portal/issues/new/choose). The form asks for reproduction steps, version and environment — say whether the problem is in the frontend, the backend, or the proxy between them, and include browser and OS for UI issues.

### Suggesting Enhancements

Check the [README](README.md) first — much of what looks like a missing feature is configurable, particularly theming, templates and feature flags.

[Open a feature request](https://github.com/Sunbird-Spark/sunbird-spark-portal/issues/new/choose) describing the problem it solves, who benefits, and alternatives you've considered. **For features, agree the approach on the issue before writing significant code.**

### Your First Code Contribution

**1. Pick something and claim it.** Filter issues by `good first issue` and `help wanted`, then comment to say you're taking it.

**2. Fork, clone and run it.**

```bash
# Fork on GitHub, then:
git clone https://github.com/<your-username>/sunbird-spark-portal.git
cd sunbird-spark-portal
git remote add upstream https://github.com/Sunbird-Spark/sunbird-spark-portal.git

# Node 24.12.0 is required
nvm install 24.12.0 && nvm use 24.12.0
```

The frontend and backend are installed and run separately:

```bash
# Frontend — http://localhost:5173
cd frontend
npm install
npm run dev

# Backend — http://localhost:3000
cd backend
npm install
cp .envExample .env     # set ENVIRONMENT=local and remove NODE_ENV
npm run dev
```

The frontend's `npm install` runs a `postinstall` step (`copy-assets.js`) that copies the assets content players need. If players fail to render, check that step ran.

Run both for full local development: Vite proxies `/api`, `/portal`, `/content/preview`, `/assets/public`, `/content-plugins`, `/content-editor`, `/generic-editor`, `/action`, `/plugins` and related paths to the backend, so the frontend alone won't serve content. The full list is in `frontend/vite.config.ts`. All environment access goes through `backend/src/config/env.ts`, which has typed defaults.

If setup fails, it's usually the wrong Node version, port 5173 or 3000 already in use, a missing `.env`, or an upstream service the proxy can't reach. **If the README didn't work as written, open an issue** with your OS, Node version and exact error — then consider fixing it.

**3. Branch and build.** Branch from the latest release branch — check the branch list for the current one; don't branch from `main`. Keep the change to one logical unit.

**4. Code sanity.**

- Lint, type checks, build and tests pass locally, for each side you touched:
  ```bash
  cd frontend && npm run lint && npm run type-check && npm run build && npm run test:run
  cd backend  && npm run lint && npm run type-check && npm run build && npm run test:run
  ```
  CI runs the build too, and it catches things `type-check` alone won't — asset resolution and bundling in particular.
- New or updated tests cover the behaviour you changed. Coverage thresholds are **70%** for branches, functions, lines and statements — `npm run test:coverage` shows where you stand.
- Files stay under **250 lines** (500 for test files), enforced by the `max-lines` ESLint rule. TypeScript strict mode applies, including `noUncheckedIndexedAccess`. No `any` without justification.
- Frontend styling uses Tailwind utilities and the `sunbird-*` design tokens from `frontend/tailwind.config.ts` — no custom CSS unless you're adding a token.
- Dependency vulnerability scan run on any added or upgraded packages.
- No credentials, tokens or real user data in code or fixtures. Never commit `.env`, `*.pem` or `*.key`.
- Deployment-specific values belong in environment configuration, not source.

**Before opening the PR:**

- [ ] Opened against the latest release branch, not `main`
- [ ] Issue linked, and you commented on it to say you're taking it
- [ ] Documentation updated — anything your change made wrong, plus API and configuration docs for anything you added
- [ ] Schema and architecture documentation added or updated using the [TEMPLATE](https://docs.google.com/document/d/1YqUzR09a5t_ebkMsCaW7juf1gZgXLudQlkYJF0jl4hY/edit?usp=sharing), if your change affects system design
- [ ] **If you added a colour palette, font or template, you have mirrored it in the Keycloak login theme in [`sunbird-spark-installer`](https://github.com/Sunbird-Spark/sunbird-spark-installer)** — see Cross-Repo Coupling in the README. Unmirrored additions silently fall back to defaults on the sign-in page.
- [ ] Your filled-in copy of the Sunbird Contribution Checklist is complete, with details rather than just ticks, and ready to attach

### Improving The Documentation

Documentation fixes are real contributions and an ideal first one — whatever tripped you up during setup is a genuine bug.

- **Where:** this repository's `README.md` for architecture, theming and setup; `docs/` for deeper material; the [documentation site](https://sunbird.gitbook.io/sunbird-spark) for user-facing content.
- **Voice:** plain, direct, active. Write for someone competent who has never seen this system.
- **Accessibility:** descriptive link text, alt text on images, real heading levels.
- **Inclusive language:** avoid idioms that don't translate and assumptions about the reader.
- Update the docs in the same change that made them wrong.

## Contribution Standards

Spark is a digital public good, deployed as national-scale infrastructure. That shapes what good code means here:

1. **Serve the public-good mission** — benefit adopters broadly, not one implementation's immediate need. Refer to the [DPG standard](https://www.digitalpublicgoods.net/standard).
2. **Uphold platform independence** — keep changes modular, and make any licensed component swappable by adopters.
3. **Protect privacy as policy, not just code** — never commit, hardcode or expose personal data.
4. **Do no harm by design** — check for bias, exclusion or barriers to access. This portal is a learner-facing surface, so accessibility and internationalisation are part of that: locale files live in `frontend/src/locales/` (en, fr, pt, ar), and RTL overrides exist in `frontend/src/styles/`.
5. **Write for people outside your team** — Sunbird's value comes from adoption.
6. **Treat documentation as part of the contribution.**
7. **Follow the repository for mechanics** — the README carries the detail.

### Using AI Tools

Welcome, with conditions:

- **Understand what you submit.** If you can't explain and debug it in review, don't open the PR.
- **Attribute it.** Add `Assisted-by: <tool name>` for substantially AI-generated code — not `Co-authored-by:`, which implies a human contributor with authorship rights.
- **Licence hygiene applies.** Output must comply with the provider's terms, infringe nobody's IP, and must not include code under licences incompatible with MIT.
- **Tests and documentation are still required.**

## Styleguides

**Branches:** `<type>/<short-description>` — `feat/course-progress-bar`, `fix/null-org-in-header`, `docs/theming-tokens`.

**Commits:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `perf:`.

```bash
git fetch upstream
git checkout -b fix/login-redirect-loop upstream/v1.1.1   # use the current working branch
git commit -m "fix: handle null org in profile header"
```

Keep commits small and atomic, and explain **why**, not just what.

## Submitting a Pull Request

Push your branch and open the PR against the latest release branch of `Sunbird-Spark/sunbird-spark-portal` — check the repository for the current one rather than assuming. GitHub defaults the base branch to `main`, so you will need to change it.

The pull request template asks for what changed, why, how you tested it, and anything a reviewer should look at closely. Include your test cases and results there. Tag the reviewer or repo owner, and link the GitHub issue and the Jira ticket if applicable.

If you touched authentication, authorisation, sessions or personal-data handling — anything under `backend/src/auth/`, `backend/src/proxies/` or `frontend/src/rbac/` — say so and ask for a security-focused review.

## What Happens After You Submit

**1. Automated checks.** [Pull Request Quality Checks](.github/workflows/pull-requests.yml) runs on every PR, on Node 24.12.0: lint, build and `test:coverage` for both frontend and backend, as separate jobs. A [dependency submission](.github/workflows/dependency-submission.yml) workflow also runs, feeding the dependency graph that vulnerability alerts are based on. Fix anything red before asking for review.

**2. Triage.** A maintainer labels the PR and assigns a reviewer. If you haven't heard anything within a week, nudge on the PR or in [Discussions](https://github.com/orgs/Sunbird-Spark/discussions) — a reminder is welcome.

**3. Review.** Expect comments, and expect a few rounds. Push follow-up commits to the same branch rather than opening a replacement PR, and reply to each comment. Disagreeing is fine; say why. If the branch falls behind, `git fetch upstream && git rebase upstream/v1.1.1`.

**4. Approval and merge.** At least one maintainer approval is required, with all comments resolved and CI green. A maintainer merges — contributors don't merge their own PRs.

**After merge.** Your change sits on the working version branch while `main` stays untouched. When that version is released, `main` is updated to it and becomes the stable version, and a new working branch is created for the next release. So your change ships when its version is released.

> [!NOTE]
> **If your PR is closed without merging,** it's usually scope, direction, or inactivity. The maintainer should say which — ask if it isn't clear.

<!-- omit in toc -->
## Licensing

This repository is licensed under MIT, in line with the DPG code licence. By contributing, you agree your contribution is licensed under the repository's [LICENSE](LICENSE).