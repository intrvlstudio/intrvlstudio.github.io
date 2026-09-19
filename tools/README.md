# Website optimization build

The site is static and GitHub Pages serves the committed output directly.

- `home.template.html` is the homepage translation source. `build-home-locales.cjs` parses it in a detached DOM, keeps one locale, and writes `index.html`, `index-en.html`, and `index-ko.html`. Edit common layout in the template and additional localized content in the build script, then rebuild.
- `build-game.cjs` bundles the readable RPG sources into `assets/rpg/game-r2.min.js` and builds the existing RPG update stylesheet. `optimization.css` is an additional stylesheet.
- `assets/rpg/comic-links.js` holds the unreleased comic's series and episode URLs. Fill `url` and `episodes[1..3]` with the verified official URLs when supplied; no game bundle rebuild is required. Change its query version in `be-my-portfolio.html` on publication.

Build dependencies: Node.js 22+, Playwright, Terser, clean-css, and Microsoft Edge. They can be resolved from `NODE_PATH` or installed locally for development.

```sh
node tools/build-home-locales.cjs
node tools/build-game.cjs
node tests/site-optimization.cjs
```

The browser regression checks use a temporary local HTTP server. Set `SITE_URL` to the deployed site for the same browser checks against production; `QA_OUTPUT` controls the screenshot/report directory. Tests exercise chapter completion, resuming a dialogue and achievement, complete saves, native file sharing through a stub, PNG download, portrait/landscape layouts, 44px controls, loading retry, and homepage locales with and without motion.

Sharing opens a native share sheet or the service's compose page. IG may require downloading/uploading the artwork; Threads/X compose links cannot automatically attach a local image. No post is automatically published.

Deployment: publish the verified branch to GitHub Pages' configured `main` branch. Verify the Pages build commit and the homepage/game HTTP responses. If a critical navigation or game flow fails, revert the optimization commit and republish; old save keys and release scheduling remain compatible.
