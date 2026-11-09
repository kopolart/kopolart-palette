# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.1.x   | Yes       |
| < 1.1   | No        |

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report vulnerabilities privately through GitHub:

1. Open the repository's **Security** tab.
2. Choose **Advisories** → **Report a vulnerability**.
3. Include the extension version, browser and version, reproduction steps,
   impact, and any proof-of-concept details.

If private advisories are unavailable, open a minimal public issue asking the
maintainers for a private contact channel — without disclosing the
vulnerability details.

## What to expect

- Acknowledgement within 5 business days.
- An initial assessment and remediation plan within 10 business days.
- Credit in the release notes if you wish to be acknowledged.

## Scope

In scope:

- The extension source in `src/` (manifest, popup, content script).
- Permission or data-handling issues, including unintended data exposure.
- Injection, XSS, or privilege-escalation issues in extension pages.
- Vulnerabilities in the release artifacts produced by this repository.

Out of scope:

- Vulnerabilities in Chrome, Edge, or other browsers.
- Issues in third-party services such as `kopolart.ir` that are unrelated to
  this extension (report those to the service owner).
- Missing security headers on unrelated sites, or issues that require an
  already-compromised browser profile.
- Social engineering and physical attacks.

## Security design notes

- The extension requests `activeTab` rather than persistent access to all
  sites, and injects `content.js` only after an explicit user action.
- API calls are restricted by `host_permissions` to `https://kopolart.ir/*`.
- Page-derived strings are HTML-escaped before insertion into the popup.
- The extension loads no remote code; all executable code ships in the
  package.
- Saved palettes are stored locally and are not synchronized or transmitted.
