# ARARART 0.8.0

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


0.8.0 adds opt-in microphone RMS and marker-relative camera proximity triggers, initial visibility, hide/show steps and camera-facing orientation. Automatic triggers are independent of tapEnabled and share each object's action sequence. Local-only mic analysis uses hysteresis, cooldown and application-audio suppression. Markerless spatial placement remains a separate future release. See README_SETUP_JA.md section 10 for exact setup and acceptance checks.
