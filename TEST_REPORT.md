# WebAR Art 0.6.0 verification

61 automated tests passed. Added tests for rotation around marker Z, full 360-degree orbit around a translated target and reset with Z up/unrestricted azimuth. Existing shadow, media, tap/audio, guided UI, installer and publisher regressions pass.

Real browser mouse/gizmo interaction, production Vite build and iPhone rendering have not been verified here. APPLY.sh runs the production build on Mac before push. Changes affect Studio camera only; AR tracking and project transforms are unchanged.

Scope: Z-axis view controls. Web Studio deployment, dashboard and tracking improvements remain future work.
