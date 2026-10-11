# ARARART 0.8.3 verification

88 regression tests passed, zero failures. Editor JavaScript and installer shell syntax checks passed.
Each action row now has a native desktop drag handle, destination highlighting and local reorder that updates numbering and draft saving. Existing up/down controls remain. Dragging is disabled during preview/busy processing. Existing action fields and behavior are preserved. Scene switching must still be the final action.

Native browser drag behavior, production Vite build and iPhone rendering were not verified here. Dependencies unavailable; previous registry requests returned HTTP 403. APPLY.sh requires install, tests, production build and dist inspection on Mac before GitHub push. User confirmed 0.8.2 device behavior before this UI change.

Evidence: studio/editor.js renderActions, studio/style.css and regression suite. Setup: README_SETUP_JA.md section 12.
