# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Source code is now licensed under MIT. Artwork and visual assets remain
  under CC BY 4.0, and Kopolart color metadata remains CC BY 4.0. There are
  no functional changes.

## [1.1.0] - 2026-11-08

First public release.

### Added

- Role-aware palette extraction with two primary colors, a light background
  tone, and a dark text tone.
- Color scoring based on visual area, element semantics (buttons, headings,
  navigation, controls), class and role hints, gradients, and SVG fills.
- Merging of near-identical colors and distinctness checks for selected roles.
- Kopolart API enrichment with Persian name, English name, wavelength, and
  purity for every extracted color.
- WCAG contrast analysis with ratio and AAA, AA, AA Large, and fail ratings.
- EyeDropper support for sampling a color directly from the page.
- Copy individual colors and copy the full palette as formatted text.
- JSON and TXT export of the active palette and its site metadata.
- Local palette library with search by site, hostname, URL, or hex value, plus
  load, copy, and delete actions.
- Persian RTL interface with the Vazirmatn typeface.
- Loading skeletons, empty states, and localized error messages.

### Security

- Uses `activeTab` and on-demand script injection instead of persistent access
  to all sites.
- Restricts host access to `https://kopolart.ir/*`.
- Keeps saved palettes in `chrome.storage.local`; no accounts, analytics, or
  tracking.
- Ships all executable code in the package; no remote code is loaded.

[1.1.0]: ../../releases/tag/v1.1.0
