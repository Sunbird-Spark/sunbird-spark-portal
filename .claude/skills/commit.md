You are creating a git commit for changes in the Sunbird Spark Portal repository. Follow these steps:

## Steps

1. Run `git status` to see what's changed
2. Run `git diff --staged` to see staged changes (if nothing staged, run `git diff HEAD` to see all changes)
3. Run `git log --oneline -10` to understand the recent commit message style
4. Analyze the changes and determine the commit type and scope
5. Stage appropriate files if nothing is staged yet (ask the user before staging if unsure)
6. Present the proposed commit message to the user for confirmation before committing
7. Create the commit

## Commit Message Format

```
{type}({scope}): {short description}

{optional body — only if the change needs explanation}
```

### Types
- `feat` — new feature or UI component
- `fix` — bug fix
- `refactor` — code restructure without behavior change
- `style` — formatting, Tailwind class changes with no logic change
- `test` — adding or fixing tests
- `chore` — build, config, dependency changes
- `docs` — documentation only
- `a11y` — accessibility improvements
- `i18n` — translation/localisation changes

### Scope
Use the area of the codebase being changed:

**Frontend scopes:**
- `workspace` — workspace pages and content cards
- `auth` — login, logout, forgot password, Keycloak flows
- `components` — shared/common components
- `rbac` — role-based access control
- `api` — API client functions in `src/api/`
- `hooks` — custom React hooks
- `services` — business logic in `src/services/`
- `config` — configuration files

**Backend scopes:**
- `routes` — Express route definitions
- `controllers` — request handlers
- `services` — backend business logic
- `auth` — OIDC/Keycloak/Google OAuth flows
- `proxy` — upstream Sunbird proxy config
- `db` — database access layer
- `config` — environment config (`env.ts`)

**Cross-cutting:**
- `build` — Vite, TypeScript, ESLint, package.json changes
- `ci` — GitHub Actions workflows

### Rules
- Subject line: max 72 characters, imperative mood ("add", not "added" or "adds")
- No period at the end of the subject line
- Body (if needed): explain *why*, not *what* — the diff shows what
- Reference issue numbers if relevant: `fixes #123`

## Examples

```
feat(workspace): add CardThumbnailBackground component for content type placeholders

Replaces empty thumbnails with premium SVG backgrounds per content type.
Gradient IDs are prefixed by type to avoid conflicts across instances.
```

```
fix(auth): validate redirect_uri protocol before appending to reset link

Prevents open-redirect attacks by rejecting non-http/https schemes.
```

```
refactor(services): extract content display config into dedicated module

Centralises icon, colour, and label mapping so components stay thin.
```

```
chore(build): pin Vite to 7.3.1 to resolve HMR regression
```

```
test(workspace): add unit tests for WorkspaceContentCard thumbnail fallback
```

---

After analyzing the changes, present the proposed commit message to the user for confirmation before committing.
