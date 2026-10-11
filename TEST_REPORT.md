# ARARART 0.8.2 verification

88 automated tests passed, zero failures, including FORCE_COLOR=1. JavaScript syntax and installer shell checks passed.

New tests verify independent visibility delay/fade timing, instant legacy visibility steps, leading appearance from hidden state, pause time consumption and animation budgets, eligible-marker scene-start execution once per entry/reentry, tap exclusion for scene-start objects, schema bounds, media opacity multiplication, packed-alpha uniform updates and isolated clip/video pauses with resume. DOM contract verifies the start-method selector. Existing tracking, media, shadows, dashboard, saving, installer and publication regressions pass. Three/GPU integration tests use adapters/mocks.

Limitations: no real iPhone/browser/GPU tests or production Vite build here. Dependencies are absent and registry requests returned 403 during previous checks. APPLY.sh requires install, tests, production build and dist inspection on Mac before GitHub push. No live publication performed here. Video pause/resume follows animation frames; exact subframe timing is not guaranteed. Audio is not paused by the object-pause action. Automatic scene timers retain their existing timing even before marker recognition.

Evidence: studio/action-sequence.js, studio/behavior.js, studio/media.js, studio/editor.js, studio/player.js, studio/schema.js; tests/scene-actions.test.mjs, tests/media-sequence.test.mjs, tests/guided-layout.test.mjs and existing regression suite. Setup and acceptance: README_SETUP_JA.md sections 10–11.
