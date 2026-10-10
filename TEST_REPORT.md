# WebAR Art 0.5.3 verification

58 automated tests passed, zero failures. Includes FFmpeg conversion, tap/audio, publisher, install preservation and three-workspace regressions.

New tests verify default light position (0,-2,3), receiver size (4,6) for a 1:1.5 marker, all four shadow directions, expanded shadow frustum, settings persistence and rejection of invalid settings. Editor and player share the direction and bounds helpers. Receiver raycast is disabled. Existing packed-alpha and sprite shadow shaders are unchanged.

User reported successful iPhone experience with 0.5.2. New 0.5.3 real-device rendering, GPU compilation and production Vite build are not verified here. APPLY.sh performs the build on Mac. Tests use mocked DOM/Three and shader strings; they are not visual tests.

Source: studio/shadow-rig.js, studio/editor.js, studio/player.js, studio/schema.js; tests/shadow-rig.test.mjs.
