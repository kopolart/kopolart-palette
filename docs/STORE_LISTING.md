# Chrome Web Store Listing

Copy-paste ready material for the Chrome Web Store developer dashboard. All
fields are provided in Persian, with English text for permission and data-use
justifications where reviewers expect it.

Repository URLs are pre-filled for
`https://github.com/kopolart/kopolart-palette`. Confirm that the privacy policy
URL is publicly accessible before submitting; if you host the policy on
`kopolart.ir`, replace the GitHub URL with that address.

## Store metadata

| Field | Value |
| --- | --- |
| Extension name | Kopolart Palette |
| Persian name in description | پالت رنگ کپل‌آرت |
| Short description | استخراج هوشمند پالت رنگ هر وب‌سایت با نام فارسی، طول موج، خلوص و بررسی کنتراست WCAG. |
| Category | Developer Tools |
| Language | Persian (fa) |
| Official website | https://kopolart.ir |
| Support URL | https://github.com/kopolart/kopolart-palette/issues |
| Privacy policy URL | https://github.com/kopolart/kopolart-palette/blob/main/PRIVACY.md |
| Version | 1.1.0 |

The public store name comes from `name` in `src/manifest.json`, which is
`Kopolart Palette`. If you prefer a Persian store name, change the manifest
name before tagging the release and update this table to match. The version
must also match `package.json` and the release tag.

## Detailed description

```text
پالت رنگ کپل‌آرت پالت رنگی هر وب‌سایت را در چند ثانیه استخراج می‌کند و آن را به
اطلاعات کاربردی رنگ‌شناسی تبدیل می‌کند.

چه کاری انجام می‌دهد؟
• چهار رنگ کاربردی از هر صفحه استخراج می‌کند: دو رنگ اصلی، یک رنگ زمینه روشن و
  یک رنگ تیره برای متن.
• برای هر رنگ نام فارسی، نام انگلیسی، طول موج و خلوص نمایش می‌دهد.
• نسبت کنتراست متن و پس‌زمینه را بر اساس استاندارد WCAG بررسی می‌کند و سطح
  AAA، AA، AA Large یا ضعیف را نشان می‌دهد.
• با قطره‌چکان می‌توانید هر رنگ دلخواه را مستقیم از صفحه انتخاب کنید.
• رنگ‌ها را تک‌تک یا به‌صورت یک پالت کامل کپی کنید.
• خروجی JSON و TXT همراه با اطلاعات سایت بگیرید.
• پالت‌ها را محلی ذخیره کنید و بعداً بر اساس نام سایت، دامنه، آدرس یا کد هگز
  جستجو کنید.

چرا متفاوت است؟
استخراج فقط بر اساس تعداد تکرار رنگ نیست. نقش رنگ (پس‌زمینه، متن، حاشیه)،
مساحت دیده‌شده، معنای المان‌هایی مثل دکمه و تیتر، نشانه‌های کلاس و role،
گرادیان‌ها و رنگ‌های SVG در امتیازدهی در نظر گرفته می‌شوند. رنگ‌های تقریباً
یکسان ادغام می‌شوند تا پالت نهایی تمیز و قابل استفاده باشد.

حریم خصوصی
بدون حساب کاربری، بدون تبلیغات و بدون ردیابی. بررسی صفحه به‌صورت محلی در
مرورگر شما انجام می‌شود. آدرس، عنوان یا محتوای صفحه ارسال نمی‌شود؛ فقط کدهای
هگز رنگ برای دریافت نام و اطلاعات رنگ‌شناسی به API کپل‌آرت فرستاده می‌شوند.
پالت‌های ذخیره‌شده فقط در حافظه محلی مرورگر شما می‌مانند.

مناسب برای
طراحان رابط کاربری، توسعه‌دهندگان فرانت‌اند، سازندگان قالب و کارشناسان
دسترسی‌پذیری که می‌خواهند پالت یک سایت را سریع بررسی کنند.

مجوز
این افزونه رایگان است؛ کد آن تحت مجوز MIT و آثار هنری آن تحت مجوز CC BY 4.0
منتشر می‌شود. اطلاعات رنگ از API کپل‌آرت (kopolart.ir) دریافت می‌شود.
```

## Permission justifications

| Permission | Persian justification | English justification |
| --- | --- | --- |
| `activeTab` | دسترسی موقت به تب فعال، فقط پس از کلیک کاربر، برای استخراج رنگ‌های همان صفحه. | Temporary access to the active tab after the user clicks the extension, used only to read the colors of that page. |
| `scripting` | تزریق اسکریپت اسکن رنگ در تب فعال پس از اقدام کاربر. | Injects the color-scanning script into the active tab after an explicit user action. |
| `storage` | ذخیره محلی پالت‌های ذخیره‌شده؛ هیچ داده‌ای به سرور ارسال نمی‌شود. | Stores saved palettes locally in the browser; no saved data is transmitted. |
| Host permission `https://kopolart.ir/*` | دریافت نام فارسی و انگلیسی، طول موج و خلوص رنگ از API کپل‌آرت. | Calls the Kopolart API to look up color names, wavelength, and purity for extracted hex codes. |

## Single purpose statement

```text
Extract the color palette of the active web page, enrich it with Kopolart color
metadata, and help the user inspect, save, and export those colors.
```

## Remote code

The extension does **not** load or execute remote code. Declare **No** for
remote code. All JavaScript ships inside the package, and the only network
request is a JSON color lookup to `https://kopolart.ir/api/color/{hex}`.

## Data use disclosure

Recommended disclosure for the Privacy practices tab:

- State that the extension does **not** collect personally identifiable
  information, health, financial, authentication, location, or user activity
  data.
- Disclose the narrow request to `kopolart.ir`: only hexadecimal color values
  derived from the active page are sent to retrieve color names and color
  metadata. No page text, images, URLs, titles, or identifiers are sent.
- Do not select advertising, data sale, or tracking uses.
- Certify limited use and link to `PRIVACY.md` as the privacy policy.

If the dashboard requires a category for the color lookup, use **Website
content** and add this explanation:

```text
Only hexadecimal color values (for example #865131) are sent to kopolart.ir to
retrieve color metadata. The request contains no page text, images, URLs,
titles, or user identifiers, and the data is not retained for tracking.
```

## Graphic assets

| Asset | File | Size |
| --- | --- | --- |
| Store screenshot | [`screenshots/store-1280x800.png`](screenshots/store-1280x800.png) | 1280 × 800 |
| Small promo tile | [`screenshots/promo-440x280.png`](screenshots/promo-440x280.png) | 440 × 280 |
| Social preview (GitHub) | [`social-preview.png`](social-preview.png) | 1280 × 640 |
| README banner | [`banner.png`](banner.png) | 1280 × 320 |
| Popup screenshot (README) | [`screenshots/popup-main.png`](screenshots/popup-main.png) | 840 × 3072 |

The 1280 × 800 screenshot meets the Chrome Web Store screenshot requirement.
The 440 × 280 tile is the optional small promotional image. Neither contains
personal data.

## Submission checklist

- [ ] Create the GitHub repository and push the contents of this folder.
- [ ] Confirm repository and privacy policy URLs point to the correct public
      pages.
- [ ] Confirm the privacy policy URL opens without signing in.
- [ ] Build the release archive (`kopolart-palette-1.1.0.zip`) from the GitHub
      release or manually from `src/`.
- [ ] Upload the archive and confirm the manifest version is 1.1.0.
- [ ] Add the store screenshot and promo tile.
- [ ] Fill in permission justifications and the single purpose statement.
- [ ] Complete the data use disclosure as described above.
- [ ] Submit for review and monitor the developer dashboard for questions.
