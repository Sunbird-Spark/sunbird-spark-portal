---
name: sunbird-rbac
description: Use when controlling access to pages, UI elements, or API endpoints based on user roles in the Sunbird Spark Portal. Covers the CONTENT_CREATOR, CONTENT_REVIEWER, ORG_ADMIN, and learner roles, and the OnboardingGuard + ProtectedRoute gate pattern.
---

## Overview

Access control in the portal is enforced at two levels: route (React Router) and component (conditional rendering). Roles are set during the OIDC/OAuth login and stored in the session (`req.session.roles`) and in the auth context (`useAuth()`). The frontend uses `ProtectedRoute` to guard entire pages and conditionally renders actions (Edit, Publish, Review) based on role. The backend applies `requireSession` and optional role checks in controllers. The onboarding flow is guarded by `OnboardingGuard`, which redirects users who have not completed onboarding.

## When to Use

**Use when:**
- Adding a new page that should only be accessible to certain roles
- Hiding or showing a UI action (button, menu item) based on role
- Adding role enforcement to a backend API controller
- Debugging an unexpected 403 or an unauthorised user reaching a protected page

**Exclude when:**
- Implementing authentication (login/logout) — use `sunbird-authentication-flows` skill
- Configuring Keycloak role mappings in the identity provider

## Core Process

1. **Know the role codes** used in this portal:
   | Role | Code | Capabilities |
   |------|------|-------------|
   | Content Creator | `CONTENT_CREATOR` | Create, edit, submit content for review |
   | Content Reviewer | `CONTENT_REVIEWER` | Review and publish/reject submitted content |
   | Org Admin | `ORG_ADMIN` | Manage users, view org-level reports |
   | Learner | *(no special role)* | Browse, enrol, and consume content |

2. **Guard entire pages** with `ProtectedRoute` in `src/AppRoutes.tsx`:
   ```tsx
   <ProtectedRoute roles={['CONTENT_CREATOR', 'CONTENT_REVIEWER']}>
     <WorkspacePage />
   </ProtectedRoute>
   ```
   Users without the required role are redirected to the home page.

3. **Guard individual actions** with role checks from the auth context:
   ```tsx
   const { user } = useAuth();
   const isCreator = user?.roles?.includes('CONTENT_CREATOR') ?? false;
   {isCreator && <Button onClick={handleCreate}>Create Content</Button>}
   ```

4. **Ensure onboarding is complete** before showing protected content — `OnboardingGuard` wraps all layout routes and redirects incomplete users to `/onboarding`. It reads onboarding status from the user profile's `framework.onboardingDetails`.

5. **Enforce roles on the backend** for sensitive operations:
   ```typescript
   // In controller
   const roles = req.session.roles ?? [];
   if (!roles.includes('ORG_ADMIN')) {
     return res.status(403).json({ message: 'Forbidden' });
   }
   ```
   Do not rely solely on frontend RBAC — backend enforcement is the authoritative gate.

6. **Check `src/rbac/` directory** for existing RBAC utilities before implementing new role logic — reuse existing helpers rather than duplicating role-checking patterns.

7. **Test both the authorised and unauthorised paths**:
   - Frontend: render `ProtectedRoute` with a mock auth context providing different role sets
   - Backend: Supertest test with a session containing the role and without it

## Common Rationalizations

| Rationalization | Reality |
|-----------------|---------|
| "The backend is internal — frontend RBAC is sufficient" | Frontend RBAC is presentational only; a determined user can call the API directly; backend enforcement is mandatory |
| "I'll check the role in the component — no need for `ProtectedRoute`" | `ProtectedRoute` provides a consistent redirect behaviour and is easier to audit; ad-hoc checks in components can be bypassed by navigating directly to the URL |
| "Onboarding guard is only needed for new users — I'll skip it" | Existing users with incomplete onboarding data also trigger the guard; skipping it causes unexpected redirects in production |
| "The role check is just UI polish — I'll add it later" | Unauthorised access to content review or user management is a data integrity issue, not a UX issue; add it now |

## Red Flags

Watch for:
- A page added to `src/AppRoutes.tsx` inside the protected layout but without a `ProtectedRoute` wrapper
- Role checks implemented with string comparisons against `user.roles` without the `?? []` null guard (`noUncheckedIndexedAccess` will catch this at compile time)
- A backend controller for a sensitive operation (publish, delete, user management) without a `req.session.roles` check
- `OnboardingGuard` removed or bypassed for a new layout route without explicit justification
- Role codes hardcoded as magic strings in multiple places — define them as constants in `src/rbac/`

## Verification

□ New protected pages wrapped in `ProtectedRoute` with the correct `roles` array  
□ Role constants defined in `src/rbac/` — no magic strings in components  
□ Backend sensitive endpoints check `req.session.roles` and return 403 for unauthorised roles  
□ Authorised and unauthorised test cases both exist for new protected routes (frontend + backend)  
□ `OnboardingGuard` remains in place for all layout routes  
□ `cd frontend && npm run lint && npm run type-check && npm run test:run` exit 0  
□ `cd backend && npm run lint && npm run type-check && npm run test:run` exit 0
