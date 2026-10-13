# ARARART 0.8.5 verification

88 regression tests passed, zero failures. Editor syntax and installer shell checks passed. DOM contract confirms preview/view reset reside in left panel, legacy import button absent, and all remaining control IDs preserved. Action/media/tracking/saving/publication regressions pass.

Changes match 1014-02.jpg: move scene preview and view reset to left panel under object list; remove legacy motion import button, action help disclosure, view heading and permanent mouse instructions. Legacy authored reactions and sequences remain compatible. AR runtime unchanged apart from version label.

No actual browser visual/GPU verification or production Vite build here; dependencies unavailable after registry HTTP 403 in previous work. APPLY.sh requires install, tests, production build and dist checks before GitHub push. User confirmed 0.8.4 operation before this UI change.

Evidence: supplied 1014-02.jpg; studio/editor.js; tests/guided-layout.test.mjs and regression suite. Instructions: README_SETUP_JA.md section 14.
