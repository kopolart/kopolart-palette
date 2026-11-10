# Publishing Guide

This folder is a complete repository root. Publish its **contents**, not the
folder itself. Everything required for GitHub, the release pipeline, and the
Chrome Web Store is already included.

## What is included

```text
GitHub/                        <- repository root
├── .github/                   CI, release workflow, issue and PR templates
├── docs/                      banner, screenshots, store listing, this guide
├── scripts/check.mjs          dependency-free repository validation
├── src/                       extension source (load this folder unpacked)
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE                    MIT (source code)
├── LICENSE-ARTWORKS           CC BY 4.0 (icons, banner, screenshots)
├── NOTICE                     License map, Kopolart API and Vazirmatn attribution
├── PRIVACY.md
├── README.md                  English
├── README.fa.md               Persian
├── SECURITY.md
├── package.json
└── .editorconfig, .gitattributes, .gitignore
```

## Step 1 — Confirm repository links

Repository URLs are pre-filled for:

```text
https://github.com/kopolart/kopolart-palette
```

They appear in `README.md`, `README.fa.md`, `CONTRIBUTING.md`,
`docs/STORE_LISTING.md`, and `package.json`. If you rename the repository,
update those references before publishing. The commands below assume the
`kopolart-palette` name.

Also confirm the Kopolart links point to the right pages, and verify the
support URL and privacy policy URL in `docs/STORE_LISTING.md`.

Optional but recommended: host a stable privacy policy page on
`kopolart.ir` and use that URL in the Chrome Web Store instead of the GitHub
file URL.

## Step 2 — Create the repository

Create a new **public** repository named `kopolart-palette` on GitHub. Do not
initialize it with a README, license, or `.gitignore`; those files already
exist here.

## Step 3 — Push the contents

Using the GitHub CLI (easiest):

```bash
cd GitHub
gh auth login
gh repo create kopolart-palette --public --source=. --remote=origin --push
```

Or with plain Git:

```bash
cd GitHub
git init
git add .
git commit -m "feat: publish Kopolart Palette v1.1.0"
git branch -M main
git remote add origin https://github.com/kopolart/kopolart-palette.git
git push -u origin main
```

If you use GitHub Desktop, choose **Add existing repository**, select the
`GitHub` folder, and publish it as a public repository.

## Step 4 — Configure the repository

In **Settings → General**:

- Description: `Chrome/Edge extension to extract, save, and inspect website color palettes with Kopolart color data and WCAG contrast.`
- Website: `https://kopolart.ir`
- Social preview: upload `docs/social-preview.png`.
- Enable Issues. Discussions is optional.

Recommended topics:

```text
chrome-extension, manifest-v3, color-palette, color-picker, wcag,
accessibility, contrast-checker, web-design, developer-tools, persian, rtl,
kopolart
```

In **Settings → Actions → General**, set Workflow permissions to
**Read and write permissions** so the release workflow can publish a release.

In **Settings → Code security and analysis**, enable:

- Private vulnerability reporting (used by `SECURITY.md`).
- Dependabot alerts and security updates.

Optional: protect `main` and require the **Verify extension package** check
before merging.

## Step 5 — Verify CI

Open the **Actions** tab. The `Verify` workflow should run on the first push
and pass. It checks the manifest, versions, required files, local popup
references, JavaScript syntax, and licenses.

You can run the same checks locally:

```bash
cd GitHub
npm run check
```

## Step 6 — Publish the first release

The release workflow builds the Chrome Web Store archive from `src/` and
attaches it to a GitHub release. The tag must match the manifest version.

```bash
git tag -a v1.1.0 -m "Kopolart Palette v1.1.0"
git push origin v1.1.0
```

After the workflow completes, the release contains:

```text
kopolart-palette-1.1.0.zip
```

That archive is ready to upload to the Chrome Web Store.

## Step 7 — Chrome Web Store submission

1. Create or open a Chrome Web Store developer account.
2. Choose **New item** and upload `kopolart-palette-1.1.0.zip`.
3. Copy the listing fields from `docs/STORE_LISTING.md`.
4. Upload `docs/screenshots/store-1280x800.png` as a screenshot.
5. Upload `docs/screenshots/promo-440x280.png` as the small promo tile.
6. Add the privacy policy URL. It must be publicly accessible without login.
7. Complete the permission justifications, single purpose statement, and data
   use disclosure from `docs/STORE_LISTING.md`.
8. Submit for review.

The first submission requires a one-time developer registration fee set by
Google. Review times vary.

## Step 8 — Keep the source in sync

`GitHub/src/` is a copy of the extension source. Choose one source of truth:

**Option A — this repository is canonical.** Make future code changes in
`GitHub/src/` and keep the original folder as an archive.

**Option B — the outer project is canonical.** After editing the parent
project, sync the source before committing:

```bash
cd ..
cp manifest.json popup.html popup.css popup.js content.js GitHub/src/
cp -r assets/fonts assets/icons GitHub/src/assets/
cd GitHub
npm run check
git add src
git commit -m "chore: sync extension source"
git push
```

Do not edit both copies independently. Version drift will fail the repository
check or ship mismatched files.

## Step 9 — Future releases

1. Update `version` in `src/manifest.json` and `package.json` to the same
   value.
2. Add a section to `CHANGELOG.md`.
3. Run `npm run check`.
4. Commit and push.
5. Create and push a matching tag, for example `v1.1.1`.
6. Download the new zip from the GitHub release and upload it to the Chrome
   Web Store.

## Pre-publish checklist

- [ ] Repository URLs point to `github.com/kopolart/kopolart-palette`.
- [ ] Repository is public and the README banner and screenshots render.
- [ ] CI passes on `main`.
- [ ] Social preview uploaded in repository settings.
- [ ] Private vulnerability reporting enabled.
- [ ] Release tag matches the manifest version.
- [ ] The release zip contains `manifest.json` at its root, not a nested folder.
- [ ] The privacy policy URL is public.
- [ ] `LICENSE`, `LICENSE-ARTWORKS`, `NOTICE`, and the font license are present in the repository.
- [ ] The Chrome Web Store listing uses the prepared text and assets.
- [ ] The primary source of truth for `src/` is documented for future work.
