# ARARART 0.8.7

Marker AR authoring with GLB, WebM and sprite media, object-specific tap/audio/scene interactions and marker-local shadows.

This release adds:
- Marker-relative pose smoothing, spike rejection and short-loss hold.
- Web/local Studio project dashboard, thumbnails, search and recent projects.
- Per-user persistent project folders, rename, duplication, trash and restore.
- Browser-supported PC folder selection for production ZIP backup.
- Authenticated Web Studio auto-save after first explicit project save and stale-write protection.
- Z-up mouse orbit with Reset View; 45-degree buttons removed.

Setup: README_SETUP_JA.md. Public Studio uses Docker/Render, persistent disk and the existing GitHub App flow. Local Studio uses the existing repository credentials. Public AR remains on GitHub Pages.

The artifact supplies implementation and deployment configuration. No live service has been deployed by this package generation. See TEST_REPORT.md for limitations.

0.7.0 adds editable sequential tap actions (rotation/movement/scale/wait/audio/scene), repeat/pingpong/re-tap/end policies, header dashboard navigation and ARARART branding. Legacy tap behaviors remain available when sequence mode is off.


0.8.7 adds a per-object tap/scene-start selector, visibility delay and fade duration, and finite per-object animation pauses. Scene reactions wait for tracking eligibility and fire once per scene entry. Existing microphone/proximity features remain removed. See README_SETUP_JA.md sections 10–11.

0.8.7 simplifies Studio controls based on the supplied screenshot: compact scale-link/tap checkboxes, per-object duplicate/delete, removed left-side tutorial/demo controls, grouped shadow/display settings and optional action guidance. AR runtime remains unchanged.
