# Checkpoint — 2026-08-21 — State Management Defect Fixes

## What was done
Fixed 5 state management defects in the ORIVIS V2 UI.

## Files changed
1. `src/contexts/PlatformPermissionsContext.tsx` — Added `useAuth` import; added `user`, `isImpersonating`, `impersonatedOrgId` to `fetchPermissions` callback deps so permissions re-fetch on auth change.
2. `src/contexts/OrgPermissionsContext.tsx` — Added `activeOrganization` to `useAuth()` destructuring; added `activeOrganization?.organizationId` to the `scope` string so permissions re-fetch on org switch.
3. `src/pages/platform/WorkspaceView.tsx` — Removed duplicate `platformService.closeWorkspaceSession(id)` call from `closeSession`; now relies solely on `exitInspection()` which already closes the session.
4. `src/contexts/PlatformGovernanceContext.tsx` — `enterInspection` catch block now resets inspection state, shows an error alert, and returns early instead of swallowing the error and navigating anyway.
5. `src/org/contexts/OrgBrandingContext.tsx` — Added `else setServerBranding(null)` when no branding cache is found for the new org, preventing stale branding from the previous org from leaking through.

## Verification
- `npx tsc --noEmit` — passed with zero errors.

## Next
None — all requested fixes complete.
