# ARARART 0.8.8 verification

88 regression tests passed, zero failures. JavaScript syntax and installer shell checks passed. DOM contract verifies metadata, primary project save, ZIP export/directory controls, restore controls and publication/QR controls are grouped under the right publication panel with all existing IDs retained. Existing storage, publisher, media and action tests pass.

Changes follow 1014-07.jpg: right panel now contains Project, Save and Publish groups; ZIP/directory controls and restore are collapsed; redundant dashboard link and extended tutorials removed; initial setup retained as a disclosure; save/publish status is displayed alongside right controls, production status remains left. No saving/publishing data logic changed.

No actual browser visual/GPU check or production Vite build here; dependencies unavailable after earlier registry 403. APPLY.sh requires install, tests, build and dist inspection on Mac before GitHub push. User confirmed 0.8.7 operation before this update. No live publication performed here.

Evidence: 1014-07.jpg; studio/editor.js, studio/style.css, tests/guided-layout.test.mjs and regression suite. Setup: README_SETUP_JA.md section 17.
