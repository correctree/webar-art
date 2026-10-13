# ARARART 0.8.7 verification

88 regression tests passed, zero failures. JavaScript and shell syntax checks passed. Updated DOM contract verifies combined production panels, two left navigation choices, marker/scene/asset disclosures, preserved control IDs, hidden guide banner and visible status moved to left sidebar. Existing tracking, actions, media, save and publication tests pass.

Changes match 1014-06.jpg: unify marker/scene and placement/reaction into one production workspace; move navigation to left; hide top guide/title/breadcrumb and two-marker helper/summary; remove marker preparation explanation; use left accordions with compact scene inputs/buttons. Existing multi-marker project data and all runtime behavior remain unchanged. Regular marker registration remains available; the old paired-demo creation shortcut is hidden.

No browser visual/GPU verification or production build performed here. Dependencies remain absent after registry HTTP 403 in prior work. APPLY.sh requires installation, tests, production build and dist checks on Mac before git push. No live deployment performed here. User confirmed 0.8.6 operation before this update.

Evidence: 1014-06.jpg; studio/editor.js, studio.html, studio/style.css; tests/guided-layout.test.mjs and regression suite. Setup: README_SETUP_JA.md section 16.
