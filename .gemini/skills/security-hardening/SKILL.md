---
name: security-hardening
description: Use when adding authentication flows, rendering user-supplied content, handling file uploads, or exposing new API endpoints in the Sunbird Spark Portal. Prevents XSS, open-redirect, session fixation, and secret leakage vulnerabilities.
---

## Overview

The portal handles OIDC sessions, OTP flows, Google OAuth, and proxies requests to upstream Sunbird services under authenticated session context. The attack surface includes user-controlled redirect URIs, HTML rendered from API responses, OTP endpoints that can be abused for enumeration, and proxy routes that may inadvertently forward sensitive headers. This skill applies security controls at each layer.

## When to Use

**Use when:**
- Adding or modifying an authentication or session flow (OIDC, Google OAuth, OTP)
- Rendering HTML or markdown from an API response in React
- Adding a new API endpoint that accepts user input
- Adding a redirect after login or logout
- Exposing a new proxy route to upstream services

**Exclude when:**
- Modifying purely static content (Tailwind classes, locale strings)
- Adding a new Radix UI component with no data binding

## Core Process

1. **Validate redirect URIs** — before appending any user-supplied or session-derived URL to a redirect, verify the scheme is `http` or `https` and the host is on an allowlist or matches the expected origin. The existing auth flow in `src/auth/` demonstrates this pattern.

2. **Sanitize all HTML output** — never pass API response strings to `dangerouslySetInnerHTML` without wrapping in `DOMPurify.sanitize()`:
   ```typescript
   import DOMPurify from 'dompurify';
   <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(apiContent) }} />
   ```

3. **Protect all non-public endpoints** — apply `requireSession` middleware in the route definition. Verify that the session contains a valid `userId` and `roles` before processing.

4. **Never hardcode secrets** — API keys, OIDC client secrets, database credentials must live in `.env` (never committed) and be accessed via `src/config/env.ts`. The CLAUDE.md security rule prohibits reading `.env` files directly.

5. **Validate and type all inputs** on the backend controller boundary — use AJV schema validation or explicit field checks before passing to a service.

6. **Apply rate limiting and reCAPTCHA** to OTP and password endpoints — the existing `portalProxyRoutes.ts` applies reCAPTCHA verification for OTP initiation; follow the same pattern for new sensitive endpoints.

7. **Audit proxy header forwarding** — when adding a new route to `portalProxyRoutes.ts` or `knowlgMwProxyRoutes.ts`, confirm that `Authorization` and `Cookie` headers are intentionally forwarded and not inadvertently exposed to third-party upstream services.

8. **Set Content Security Policy** via Helmet — any new inline script or external resource URL must be added to the CSP allowlist in the Helmet configuration rather than disabling CSP globally.

## Common Rationalizations

| Rationalization | Reality |
|-----------------|---------|
| "The API response is from our own backend — it's safe to render" | Stored XSS injects malicious HTML at the source; always sanitize HTML at the render site |
| "The redirect URL comes from our OIDC config — it's trusted" | OIDC `state` and `redirect_uri` parameters can be tampered with; validate before following |
| "I'll add the secret to the `.env.example` file for documentation" | `.envExample` is committed; put only placeholder values there, never real secrets |
| "The endpoint is internal — authentication is not needed" | Internal routes are still accessible to authenticated-but-unauthorized users; apply RBAC at every endpoint |

## Red Flags

Watch for:
- `dangerouslySetInnerHTML={{ __html: value }}` without `DOMPurify.sanitize(value)`
- `res.redirect(req.body.redirectUrl)` or `res.redirect(req.query.next)` without URL validation
- A new route file that doesn't import or apply `requireSession`
- `process.env.SECRET_KEY` or any secret literal in source code
- A new `axios` call in a service that forwards the full `req.headers` object to an external upstream

## Verification

□ All HTML from external sources passes through `DOMPurify.sanitize()` before rendering  
□ All redirect targets are validated against a scheme and host allowlist  
□ Every new authenticated route applies `requireSession` middleware  
□ No secrets or credentials appear in source files or `.envExample`  
□ New input-accepting endpoints validate all required fields and reject invalid input with 400  
□ `cd backend && npm run lint && npm run type-check` exit 0  
□ Security-relevant logic is covered by at least one Supertest test asserting the rejection behaviour
