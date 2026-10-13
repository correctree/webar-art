# ARARART 0.8.6 verification

88 regression tests passed, zero failures. JavaScript syntax and installer shell checks passed. DOM contract verifies placement, reaction and sequence disclosures retain their form IDs and selected-title is hidden. Existing action, tracking, audio, save and publication tests pass.

Changes follow 1014-03/04/05.jpg: hide redundant selected-work/adjustment headings; retain accessible work-name input; native details/summary accordions for placement/display, reaction/animation and sequential actions; rename start method to trigger and scene-switch labels accordingly; compact action labels/inputs, spacing and drag/tool buttons. Layout disclosure state is retained when switching selected objects; authored behavior/data schema is unchanged.

No real browser visual/GPU check or production build performed here; dependencies unavailable after earlier registry HTTP 403. APPLY.sh requires install, tests, build and dist checks on Mac before GitHub push. User confirmed 0.8.5 prior to this UI update.

Evidence: supplied 1014-03.jpg, 1014-04.jpg, 1014-05.jpg; studio/editor.js, studio.html, studio/style.css; tests/guided-layout.test.mjs and existing suite. Setup: README_SETUP_JA.md section 15.
