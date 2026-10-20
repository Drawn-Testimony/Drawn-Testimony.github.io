# A Danish Boy In Theresienstadt: Drawn Testimony

Welcome! 

https://drawn-testimony.github.io/

## Augmented reality

Choose **AR** in the navigation, allow camera access, and point the camera at the full drawing for the selected scene. The tracked drawing acts as the base image; highlighted objects can be tapped to open the same story entries as in the regular view. Camera access requires HTTPS or localhost.

The image targets in `public/ar-targets` are compiled from the scene SVGs. After changing a scene drawing, run `npm run build:ar-targets` and commit the updated `.mind` files. This script needs Google Chrome or a Chromium executable supplied through `CHROME_PATH`. `npm run build` regenerates the browser AR runtime.

The repository disables dependency install scripts because MindAR's unused Node canvas package requires native build tools. The AR target compiler runs in Chrome, and the browser runtime is bundled with esbuild.
