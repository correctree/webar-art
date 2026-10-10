# WebAR Art 0.5.1 verification

Executed: Node test runner, 51 tests passed / 0 failed; actual FFmpeg VP9 alpha→packed-alpha H.264 conversion included.
New coverage: exclusive per-scene tap response; blank draft vs publication validation; owner-isolated disk draft persistence; traversal rejection; scene-scoped local git commands; stale revision/missing file blocks QR; guided layout retains existing controls and separates placement/behavior; cross-origin draft mutation denied.
Guided layout test runs the real layout function against a minimal DOM contract. It is not a browser rendering test.
Syntax checks: browser JS and publisher modules.
Build copying regression uses fixture dependencies. It is not the real production Vite build.

Unavailable here: production dependencies installation (registry returned HTTP 403), real Vite build, browser/WebGL render, live GitHub OAuth/Git push, live Pages deploy, iPhone camera/tap/audio/opacity. APPLY.sh requires actual install, all tests, production build and dist checks on the user's Mac before pushing.

Sources: local implementation studio/editor.js, studio/workflow.js, studio/media.js, publisher/drafts.mjs, publisher/local-publish.mjs; test files tests/workflow.test.mjs and tests/guided-layout.test.mjs.

0.5.1 additions: proportional numeric scaling and independent axis validation; tap disable suppresses action/timer while preserving configuration; toggling restores delayed scene transition; optional control and shadow fields validate/round-trip; actual guided layout moves tool controls to inspector and retains scene switch controls. Three.js shadow rendering implemented in editor/player, but browser WebGL and iPhone appearance/performance remain unverified.
