# Hengyi Li — personal website

Static academic homepage: https://peterhelmold.github.io/

## Structure

- `index.html`: profile, education, research and coursework.
- `assets/css/`: layout, typography, controls and motion.
- `assets/js/`: navigation, appearance, disclosures and email copy.
- `files/`: CV and thesis PDFs.
- `images/`: responsive portrait, original portrait and school logos.
- `about/` and `cv/`: compatibility redirects.
- `_config.yml`: minimal GitHub Pages exclusions for local files.

## Preview

Run `python -m http.server 8990 --bind 127.0.0.1` from this directory,
then open http://127.0.0.1:8990/. Local preview needs no Node or Ruby dependencies.

Available PDF resources use solid buttons. Pending course resources use
dashed placeholders. When replacing the CV, keep the homepage and `/cv/`
redirect consistent with its filename. Update CSS/JS query versions when
publishing asset changes.

## Attribution

Originally based on Academic Pages / Minimal Mistakes. The original MIT
copyright notice is retained in `LICENSE`.

Unused template files were moved to the sibling local directory
`website-template-archive-20260917`. Its `restore-manifest.json` maps each
archived target to its original path. Original configuration and README
copies are also stored there. This archive is not part of the website.
