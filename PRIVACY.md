# Privacy Policy — Kopolart Palette

**Effective date:** 2026-11-08
**Last updated:** 2026-11-08

Kopolart Palette is a browser extension that extracts the color palette of a
web page. This policy explains exactly what the extension does with data.

## Summary

- No accounts, no analytics, no advertising, no tracking.
- Page inspection happens **locally** in your browser.
- Only hexadecimal color codes are sent to the Kopolart API to look up color
  names and color-science metadata.
- Saved palettes stay on your device in `chrome.storage.local`.
- Nothing is sold or shared with third parties for marketing.

## Data processed

### 1. Page content (local only)

When you click **Extract palette**, the extension reads computed styles
(background colors, text colors, borders, gradients, and SVG fills) from the
active tab. This processing occurs in your browser. Page content, URLs, and
DOM data are **not** uploaded to Kopolart or anyone else.

### 2. Color lookup requests (Kopolart API)

For each extracted color, the extension sends a request to:

```
https://kopolart.ir/api/color/{hex}
```

The request contains only the six-digit hexadecimal code (for example
`865131`). It does not include your identity, the page URL, the page title, or
any other browsing data. Kopolart's server returns a Persian name, English
name, wavelength, and purity value for that color. Standard server logs at
kopolart.ir may record technical information such as IP address and request
time as described in Kopolart's own policies.

### 3. Saved palettes (local only)

When you click **Save palette**, the extracted palette, page title, URL,
hostname, and creation time are stored in `chrome.storage.local` on your
device. This data never leaves your browser through the extension. Removing
the extension or clearing its storage deletes it.

### 4. Clipboard

Color codes are written to the clipboard only when you click a **Copy**
button. The extension never reads clipboard contents.

### 5. Downloads

JSON and TXT exports are generated locally and saved through your browser's
download mechanism. No download content is transmitted anywhere.

## Permissions

| Permission        | Why it is needed                                                        |
| ----------------- | ----------------------------------------------------------------------- |
| `activeTab`       | Read the current tab only after you click the extension button.         |
| `scripting`       | Inject the palette scanner into the active tab on demand.               |
| `storage`         | Save palettes locally on your device.                                   |
| `kopolart.ir` host | Call the color lookup API for names and color-science metadata.        |

The extension does not request broad host access and does not run on browser
internal pages (`chrome://`, `edge://`, extension pages, and similar).

## Data retention

Kopolart does not receive stored palettes or browsing history from this
extension. API requests contain only color codes. Locally saved palettes are
retained until you delete them or uninstall the extension.

## Children's privacy

The extension is not directed at children and does not knowingly collect
personal information from anyone.

## Changes

Material changes to this policy will be published in this file and noted in
[CHANGELOG.md](CHANGELOG.md).

## Contact

Questions about privacy can be raised through the repository's issue tracker
or the contact options on [kopolart.ir](https://kopolart.ir).

---

## خلاصه فارسی

افزونه «پالت رنگ کپل‌آرت» هیچ حساب کاربری، ابزار تحلیلی، تبلیغات یا ردیابی
ندارد. اسکن صفحه به‌صورت محلی در مرورگر شما انجام می‌شود و محتوای صفحه، آدرس
یا عنوان سایت به سرور ارسال نمی‌شود. تنها کدهای هگز رنگ برای دریافت نام رنگ،
طول موج و خلوص به API کپل‌آرت (`kopolart.ir/api/color`) فرستاده می‌شوند.
پالت‌های ذخیره‌شده فقط در حافظه محلی مرورگر (`chrome.storage.local`) نگهداری
می‌شوند و با حذف افزونه یا پاک‌کردن داده‌ها از بین می‌روند.
