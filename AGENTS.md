# Agent Guidelines for Academic Pages (academicpages.github.io, v.0.9.x)

**This file contains important information for coding agents working in this repo.**

## Personal website design rules

- Follow README.md's Design conventions as the canonical token/interaction spec.
- Use six typography roles and at most three rectangular corner roles (panel,
  control, inset); reuse the 120/180/280ms motion timings and reduced-motion fallbacks.
- Portrait frames, school badges, Research and Coursework use the same content
  surface. All PDF controls (including CV and resource placeholders) have
  transparent backgrounds; linked controls retain the shared hover tint.
  Do not add one-off background colours.

- Keep the portrait and name on one horizontal row, including responsive layouts.
- Links that navigate away from the current page use the shared ↗ icon.
  In-page anchors and email links do not use ↗.
- PDF resources use bordered controls; ordinary web links use the shared
  animated underline without a border (including course links and GitHub).
  Classify by the actual destination, not only the URL extension: the current
  UvA Repository URL serves a PDF and therefore retains its border.
- Notes and Essay placeholders reserve PDF controls; keep their frames and
  do not add availability wording.

`academicpages.github.io` is a Jekyll theme for academic, professional, and personal portfolio-oriented websites. The the typical use pattern is to "Use this template" to "Create a new repository" (see [Creating a repository from a template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)) where the user will then make their own edits to customize the template to create their own personal GitHub pages website. 

If a user has created a personal website, there is **no need** to create a pull request back to the `academicpages.github.io` repository.
