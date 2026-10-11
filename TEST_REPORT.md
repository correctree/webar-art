# ARARART 0.8.1 verification

82 automated tests passed, zero failures. Editor/player syntax checks passed. Sound-volume and proximity controls, microphone button, detector modules and runtime updates removed. Tap-based audio playback, hide/show and camera-facing actions remain.

Regression coverage includes existing installer, tracking, shadows, media, dashboard, saving/publication and sequences. New compatibility coverage imports a 0.8 project with automatic triggers and hidden initial visibility: obsolete fields are stripped, assets/actions preserved, tapEnabled preserved, and hide/wait/show/camera steps still execute. DOM contract verifies removed controls are absent.

Production build and real iPhone/browser rendering were not performed here: dependencies unavailable and registry requests returned HTTP 403 during 0.8 work. APPLY.sh requires dependency installation, automated tests, production build and dist checks on Mac before GitHub push. No external deployment performed here.

Evidence: studio/editor.js, studio/player.js, studio/behavior.js, studio/schema.js, studio/action-sequence.js and tests/action-sequence.test.mjs, tests/guided-layout.test.mjs, tests/media-sequence.test.mjs. Setup and acceptance steps: README_SETUP_JA.md section 10.
