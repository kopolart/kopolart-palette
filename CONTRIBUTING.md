# Contributing to Kopolart Palette

Thanks for taking the time to improve Kopolart Palette. This project is a
small, dependency-free browser extension, so contributions stay focused and
easy to review.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- Report reproducible bugs using the bug report template.
- Request features that fit the extension's single purpose.
- Improve documentation, Persian copy, or accessibility.
- Send focused pull requests for issues or clearly scoped improvements.

For large changes, open an issue first so the approach can be agreed on before
you invest time in implementation.

## Development setup

Requirements:

- Node.js 20 or newer (only for repository checks; the extension has no build
  step and no runtime dependencies).
- Chrome or Edge 95+.

```bash
git clone https://github.com/kopolart/kopolart-palette.git
cd kopolart-palette
npm run check
```

Load the extension:

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select the `src/` folder.
4. After editing files, press the reload button on the extension card.

## Project layout

| Path | Purpose |
| --- | --- |
| `src/manifest.json` | Manifest V3 definition, permissions, icons |
| `src/popup.html` | Popup markup (Persian, RTL) |
| `src/popup.css` | Popup styles and Vazirmatn font faces |
| `src/popup.js` | UI logic, API enrichment, exports, storage |
| `src/content.js` | Page scanner and palette selection algorithm |
| `scripts/check.mjs` | Repository and package validation |
| `docs/` | Visual assets, store listing, publishing guide |

## Code guidelines

- Use plain JavaScript, HTML, and CSS. Do not add frameworks or build tools.
- Keep all executable code inside the package. Remote code is not allowed by
  Chrome Web Store policy and is not used here.
- Keep the UI in Persian and RTL, matching the existing tone and labels.
- Escape any page-derived string before inserting it into HTML. The popup uses
  `escapeHtml` for this purpose.
- Use 4 spaces for JavaScript, HTML, and CSS, and 2 spaces for YAML and
  Markdown, as defined in `.editorconfig`.
- Do not broaden permissions. `activeTab` and on-demand injection are
  intentional.
- Do not send page content, URLs, titles, or identifiers to external services.
  Only hexadecimal color codes may be sent to the Kopolart API.

## Manual test checklist

Before opening a pull request, verify:

- [ ] `npm run check` passes.
- [ ] The extension loads without errors on `chrome://extensions`.
- [ ] Extraction works on at least two regular websites (light and dark).
- [ ] The loading state, error state, and empty state render correctly.
- [ ] Copy, JSON export, TXT export, and save work.
- [ ] Saved palettes can be searched, loaded, copied, and deleted.
- [ ] Contrast results match an independent WCAG calculator for a known pair.
- [ ] The EyeDropper opens and returns a color when supported.
- [ ] No console errors appear in the popup or the page.

## Commit messages

Use short, imperative messages. Conventional Commit prefixes are welcome:

```text
feat: add palette search by hex
fix: keep copy button state after re-render
docs: clarify privacy policy for API requests
chore: bump version to 1.2.0
```

## Pull requests

- Keep each pull request focused on one change.
- Describe the problem, the approach, and how you tested it.
- Include before/after screenshots for visual changes.
- Update documentation when behavior or permissions change.
- Do not include generated archives or `node_modules`.

## Versioning

The version in `src/manifest.json` and `package.json` must match. The check
script enforces this. Releases are created by pushing a tag such as `v1.1.0`;
the release workflow verifies the tag, builds the archive, and publishes it.

## Licensing of contributions

The project is licensed under CC BY 4.0. By submitting a contribution, you
agree that it is provided under the same license and that you have the right to
submit it. Do not contribute code or assets that are incompatible with
CC BY 4.0 or the SIL Open Font License (for font files).

## Security

Do not report vulnerabilities in public issues. Follow
[SECURITY.md](SECURITY.md) instead.
