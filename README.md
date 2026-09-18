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

Research PDFs and the CV use bordered controls. Course resources retain
their bordered labels without availability wording. When replacing the CV, keep the homepage and `/cv/`
redirect consistent with its filename. Update CSS/JS query versions when
publishing asset changes.

## Design conventions

- Three rectangle radius roles: panels/menus 24px (20px on phones), controls
  12px, inset image corners 8px. Portrait corners are 12/8px. Do not introduce
  separate hover radii. Navigation capsules and circular utility controls are shapes,
  not additional rectangle radius levels.
- Six type roles: metadata 12px, body 14px, subhead/reading 18px, section 24px,
  thesis titles 30–43px, name 36–64px. The last two are responsive; other roles
  stay constant. Supervisor names use the 14px body role, labels use 12px.
- Research uses serif titles and 18px serif work descriptions,
  with sans-serif metadata, fine rules and flat surfaces. Coursework uses
  the system sans-serif face, inset separators and secondary resource status.
- Light pairs a beige canvas with off-white surfaces; dark pairs warm charcoal
  `#1c1b19` with `#25231f` surfaces. Surface and text tokens must change together.
- Portrait frames, school badges, Research and Coursework share one content
  background: `#fbfaf8` light / `#25231f` dark. All PDF controls (including CV
  and resource placeholders) have transparent backgrounds; linked controls
  retain the shared hover tint. Original photo/logo pixels are not recoloured.
- Appearance starts in System on every load and refresh, and responds to OS
  changes. Manual choices last only for the current page. Clicking toggles light/dark;
  hovering for 650ms or holding for 500ms opens the three options.
  The menu stays open across pointer movement and selection; outside clicks,
  Escape or tabbing out dismiss it. Arrow Down focuses the selected radio.
  Palette changes fade together over 280ms; first paint and reduced-motion
  preferences switch immediately. Rapid toggles continue from the current colours.
- Keep the existing 120/180/280ms press/feedback/expansion timings and
  reduced-motion support. Only interactive elements receive press feedback.
- Links: animated underline for web/email links; border for PDFs. All page-leaving
  navigation has an arrow, but email and in-page anchors do not. Notes/Essay
  placeholders are static, framed PDF slots and intentionally do not animate.
- Navigation retains its selected-section capsule and uses the same 8% accent
  hover tint as ordinary web links, without an outbound-link underline.
- Interaction coverage: links and PDFs have hover/focus/press feedback; summaries
  have hover/focus/press, animated height and chevrons; navigation has a sliding
  selection; theme options have a sliding selection and icon crossfade; email copy
  has a checkmark and live status; back-to-top has reveal/hover/press feedback.

## Final verification (2026-09-17)

- Inspected computed styles at 320, 390, 680, 768, 980 and 1280px: six font sizes,
  three rectangle radii per breakpoint, one content surface and no horizontal overflow.
- Visually reviewed both themes and the mobile expanded course list.
  Checked Beyond Mathematics capitalisation and outbound arrows.
- Browser checks covered copy success, theme selection/trigger while menu stays open,
  Escape focus restoration, navigation, research/course disclosures and back-to-top.
- Executed theme event regression checks for normal/reduced motion, including delayed
  hover, long press, pointer-gap/label-blur race, outside click and Tab dismissal.
  Disclosure regression checks covered open/close, aria/inert state and rapid reversal
  in both modes. CSS reduced-motion rules disable transitions; disclosure JS settles
  immediately under reduced motion and cancels expansion on resize/preferences changes.
- JavaScript syntax checks and git diff whitespace check pass. This is local
  verification; changes have not been published to GitHub Pages.

## Attribution

Originally based on Academic Pages / Minimal Mistakes. The original MIT
copyright notice is retained in `LICENSE`.

Unused template files were moved to the sibling local directory
`website-template-archive-20260917`. Its `restore-manifest.json` maps each
archived target to its original path. Original configuration and README
copies are also stored there. This archive is not part of the website.
