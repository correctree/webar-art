# WebAR Art 0.5.2 verification

55 automated tests passed, zero failures. Includes actual FFmpeg VP9 alpha to Safari-compatible packed H.264 conversion, saved-data validation, tap/audio regression, local-publisher QR confirmation and repository install backup/preservation.

New verification: all existing control IDs retained in three integrated workspaces; marker and scene management appear together; object properties and behavior are simultaneously available; save/publish/QR share a workspace. Mock-Three unit tests verify marker-parented light/target/receiver, scale-aware frustum (800x anchor), alpha-mask depth patch. All three media shadow flags validate and round-trip.

Not verified: actual browser/WebGL shader compilation and rendering, real production Vite build, live GitHub publish in this environment, iPhone rendering and shadow performance. Dependency registry returned 403 earlier and browser executable is unavailable. APPLY.sh performs production build on the user's Mac before pushing.

Cause interpretation: fixed world-sized shadow bounds can exclude scaled AR marker content. The code has been changed to follow anchor scale; the exact original device failure has not been instrumented on the iPhone.

Source: studio/shadow-rig.js, studio/media.js, studio/player.js, studio/editor.js; tests/shadow-rig.test.mjs and tests/guided-layout.test.mjs. Tests use mocked DOM/Three and shader strings; they are not visual or GPU tests.
