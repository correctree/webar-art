# WebAR Art 0.6.1 verification

73 automated tests passed, zero failures. JavaScript syntax checks passed for editor, player, pose stabilizer, dashboard and server/store.

New tests: marker-relative smoothing; isolated position, rotation and scale spike rejection; persistent relocation; continued smoothing after acceptance; short loss and reacquisition; shortest-path normalized quaternion interpolation. Project folder/thumbnail persistence across restart; owner isolation; legacy draft discovery; rename/move/trash/restore; duplicate IDs; concurrent saves/copies; stale revision protection. Real dashboard render function runs in a mock DOM for folder/trash/search/card actions. Guided Studio DOM test verifies 45-degree buttons absent and reset/folder/tracking controls present. Remote server integration denies unauthenticated project/folder reads and writes; cross-origin mutations are rejected. Existing conversion, audio/tap, shadow, publisher and installer tests also pass.

Not verified: browser GPU rendering or pointer behavior of this revision, File System Access directory permissions in a real browser, live GitHub OAuth/Render deployment, iPhone tracking improvement. npm install returned 403 for @8thwall/engine-binary, so production Vite build could not run here. APPLY.sh runs production build and distribution checks on the user's Mac.

No claim of guaranteed tracking stability. Pose thresholds are initial defaults and require iPhone validation. No live server was provisioned. Render persistence/login need the documented configuration.

Sources: studio/pose-stabilizer.js, studio/player.js, studio/editor.js, studio/dashboard.js, publisher/drafts.mjs, publisher/server.mjs and corresponding tests.
Reference documentation consulted: https://hiukim.github.io/mind-ar-js-doc/quick-start/tracking-config/ ; https://render.com/docs/disks ; https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker

Hotfix: child server port uses raw stdout instead of console numeric formatting. All 73 tests also pass with FORCE_COLOR=1.
