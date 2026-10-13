# ARARART 0.8.4 verification

88 regression tests passed, zero failures. JavaScript and installer shell syntax checks passed. Updated DOM contract verifies checkbox scale-link control, relocated object-list actions, absence of demo button, and shadow controls grouped under a disclosure. Existing media, sequence, tracking, audio, shadows, saving and publication tests pass.

Studio UI changes: remove left tutorial/demo controls; checkbox scale link beside size heading; per-object tap checkbox and compact duplicate/delete buttons; individual display/shadow controls and project-wide shadow disclosure; Sprite FPS only for Sprite; optional action guidance. List operations are disabled during preview and refreshed after async tasks. Deleting an unselected object preserves the current transform gizmo. AR runtime is unchanged apart from version label.

No actual browser visual/GPU test or production Vite build here: dependencies remain unavailable after registry HTTP 403 in previous work. APPLY.sh requires install, tests, build and dist inspection on Mac before GitHub push. User confirmed 0.8.3 operation before this change. No live publication was performed here.

Evidence: supplied 1014-01.jpg annotations; studio/editor.js, studio.html, studio/style.css, tests/guided-layout.test.mjs, regression suite. Acceptance steps: README_SETUP_JA.md section 13.
