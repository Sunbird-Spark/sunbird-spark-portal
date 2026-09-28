## What changed

<!-- A sentence or two on the change itself. -->

**Affects:** <!-- frontend / backend / both -->

## Why

Fixes #<!-- issue number -->

- [ ] I commented on the issue to say I was taking it

## How this was tested

<!--
What you tested, how, and the outcome. Include test output where relevant.
For UI changes, add before/after screenshots and say which browser you used.
-->

## Anything a reviewer should look at closely

<!-- Tag the reviewer or repo owner. Leave blank if nothing stands out. -->

## Contribution Checklist

Link to your filled-in copy: <!-- paste here -->

## Before review

- [ ] Opened against the latest release branch, not `main`
- [ ] `npm run lint`, `npm run type-check`, `npm run build` and `npm run test:run` pass for each side touched
- [ ] Tests added or updated; coverage still meets the 70% thresholds
- [ ] Files stay under 250 lines (500 for tests), no unjustified `any`
- [ ] No credentials, tokens or real user data in the diff — no `.env`, `*.pem` or `*.key`
- [ ] Dependency vulnerability scan run, if packages were added or upgraded

## Documentation

- [ ] Updated anything this change made wrong, plus API and configuration docs for anything added
- [ ] Schema and architecture documentation updated using the [template](https://docs.google.com/document/d/1YqUzR09a5t_ebkMsCaW7juf1gZgXLudQlkYJF0jl4hY/edit?usp=sharing), if this change affects system design
- [ ] Not applicable — this change needs no documentation

## Theming changes

- [ ] Not applicable — this PR adds no colour palette, font or template
- [ ] Mirrored in the Keycloak login theme in [`sunbird-spark-installer`](https://github.com/Sunbird-Spark/sunbird-spark-installer), and `styles=css/login.css?v=…` bumped

<!--
Unmirrored additions fall back to defaults on the sign-in and set-password pages —
the portal looks right, the login page doesn't. See Cross-Repo Coupling in the README.
-->

## Security

- [ ] This change touches `backend/src/auth/`, `backend/src/proxies/`, `frontend/src/rbac/`, sessions, or personal-data handling

<!-- If checked, say what below and ask for a security-focused review. -->

<!--
Used AI tools? Declare them on the Contribution Checklist, and add an
`Assisted-by: <tool name>` commit trailer for substantially AI-generated code.
-->