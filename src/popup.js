let currentPalette = null;
let currentSite = null;

const extractBtn = document.getElementById("extractBtn");
const eyeDropperBtn = document.getElementById("eyeDropperBtn");
const copyAllBtn = document.getElementById("copyAllBtn");
const downloadBtn = document.getElementById("downloadBtn");
const saveTxtBtn = document.getElementById("saveTxtBtn");
const savePaletteBtn = document.getElementById("savePaletteBtn");

const eyedropperResult = document.getElementById("eyedropperResult");
const eyedropperSwatch = document.getElementById("eyedropperSwatch");
const eyedropperHex = document.getElementById("eyedropperHex");
const eyedropperRgb = document.getElementById("eyedropperRgb");
const eyedropperCopyBtn = document.getElementById("eyedropperCopyBtn");

const paletteContainer = document.getElementById("paletteContainer");
const savedPalettesContainer = document.getElementById("savedPalettes");
const searchInput = document.getElementById("searchInput");
const siteLabel = document.getElementById("siteLabel");

const contrastBox = document.getElementById("contrastBox");
const contrastBadge = document.getElementById("contrastBadge");
const contrastSample = document.getElementById("contrastSample");
const contrastRatioText = document.getElementById("contrastRatioText");
const contrastStatusText = document.getElementById("contrastStatusText");

// رویدادهای اصلی
extractBtn.addEventListener("click", extractPalette);
if (eyeDropperBtn) eyeDropperBtn.addEventListener("click", pickWithEyeDropper);
copyAllBtn.addEventListener("click", () => copyAllColors(copyAllBtn));
downloadBtn.addEventListener("click", downloadJSON);
saveTxtBtn.addEventListener("click", saveTXT);
savePaletteBtn.addEventListener("click", savePalette);
searchInput.addEventListener("input", renderSavedPalettes);

if (eyedropperCopyBtn) {
    eyedropperCopyBtn.addEventListener("click", async () => {
        const hex = eyedropperHex.textContent;
        if (hex) {
            try {
                await navigator.clipboard.writeText(hex);
                flashButtonText(eyedropperCopyBtn, "کپی شد");
            } catch (err) {
                console.error("Copy eyedropper color failed:", err);
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderSavedPalettes();
    setActionButtonsState(false);
});

// تزریق پویا به تب فعال در صورت نیاز (بدون نیاز به دسترسی همیشگی در همه صفحات)
async function ensureContentScriptInjected(tabId) {
    try {
        const ping = await chrome.tabs.sendMessage(tabId, { type: "PING" });
        if (ping?.pong) return true;
    } catch {
        // اسکریپت هنوز لود نشده است
    }

    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ["content.js"]
        });
        await new Promise((r) => setTimeout(r, 60));
        return true;
    } catch (err) {
        console.error("تزریق اسکریپت ناموفق بود:", err);
        return false;
    }
}

function setExtractionLoading(isLoading) {
    if (isLoading) {
        extractBtn.disabled = true;
        extractBtn.innerHTML = `<span class="spinner-btn"></span> در حال استخراج پالت...`;
        if (eyeDropperBtn) eyeDropperBtn.disabled = true;
        setActionButtonsState(false);
        if (contrastBox) contrastBox.style.display = "none";

        paletteContainer.className = "palette-grid";
        paletteContainer.innerHTML = `
            <div class="loading-wrapper">
                <div class="loading-status">
                    <span class="spinner-icon"></span>
                    <span>در حال اسکن هوشمند صفحه و دریافت اطلاعات رنگ‌ها...</span>
                </div>
            </div>
            ${Array.from({ length: 4 })
                .map(
                    () => `
                <div class="skeleton-card">
                    <div class="skeleton-preview"></div>
                    <div class="skeleton-body">
                        <div class="skeleton-line w-60"></div>
                        <div class="skeleton-line w-80"></div>
                        <div class="skeleton-line w-40"></div>
                        <div class="skeleton-line btn-shimmer"></div>
                    </div>
                </div>
            `
                )
                .join("")}
        `;
    } else {
        extractBtn.disabled = false;
        extractBtn.textContent = "استخراج پالت رنگ";
        if (eyeDropperBtn) eyeDropperBtn.disabled = false;
    }
}

async function extractPalette() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
        paletteContainer.className = "palette-grid empty";
        paletteContainer.innerHTML = `<div class="empty-state">تب فعالی یافت نشد</div>`;
        return;
    }

    if (!isSupportedUrl(tab.url)) {
        paletteContainer.className = "palette-grid empty";
        paletteContainer.innerHTML = `<div class="empty-state">این صفحه توسط افزونه پشتیبانی نمی‌شود (صفحات سیستمی مرورگر مجاز نیستند)</div>`;
        return;
    }

    setExtractionLoading(true);

    try {
        const injected = await ensureContentScriptInjected(tab.id);
        if (!injected) {
            paletteContainer.className = "palette-grid empty";
            paletteContainer.innerHTML = `<div class="empty-state">امکان تزریق اسکریپت در این صفحه وجود ندارد</div>`;
            return;
        }

        const result = await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_PALETTE" });

        if (!result || !result.success || !result.palette) {
            paletteContainer.className = "palette-grid empty";
            paletteContainer.innerHTML = `<div class="empty-state">استخراج پالت رنگ با شکست مواجه شد</div>`;
            return;
        }

        currentPalette = await enrichPaletteWithColorInfo(result.palette);
        currentSite = {
            title: tab.title || "سایت بدون عنوان",
            url: tab.url || "",
            hostname: safeHostname(tab.url)
        };

        siteLabel.textContent = currentSite.hostname || currentSite.title || "سایت جاری";

        renderCurrentPalette(currentPalette);
        renderContrastAnalysis(currentPalette);
        setActionButtonsState(true);
    } catch (error) {
        console.error("Extract palette error:", error);
        paletteContainer.className = "palette-grid empty";
        paletteContainer.innerHTML = `<div class="empty-state">خطا در ارتباط با صفحه. لطفاً صفحه را رفرش کرده و مجدداً امتحان کنید.</div>`;
        setActionButtonsState(false);
    } finally {
        setExtractionLoading(false);
    }
}


// ابزار قطره‌چکان (EyeDropper API)
async function pickWithEyeDropper() {
    if (!window.EyeDropper) {
        alert("مرورگر شما از قابلیت قطره‌چکان (EyeDropper) پشتیبانی نمی‌کند.");
        return;
    }

    try {
        const eyeDropper = new EyeDropper();
        const result = await eyeDropper.open();

        if (result && result.sRGBHex) {
            const hex = result.sRGBHex.toUpperCase();
            const rgb = hexToRgb(hex);

            eyedropperSwatch.style.backgroundColor = hex;
            eyedropperHex.textContent = hex;
            eyedropperRgb.textContent = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : "";
            eyedropperResult.style.display = "flex";
        }
    } catch (e) {
        // کاربر انتخاب رنگ را لغو کرد (ESC یا کلیک بیرون)
        console.log("EyeDropper closed or cancelled");
    }
}

function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    if (clean.length === 6) {
        return {
            r: parseInt(clean.substring(0, 2), 16),
            g: parseInt(clean.substring(2, 4), 16),
            b: parseInt(clean.substring(4, 6), 16)
        };
    }
    return null;
}

function isSupportedUrl(url) {
    if (!url) return false;
    return /^https?:\/\//i.test(url);
}

function setActionButtonsState(enabled) {
    copyAllBtn.disabled = !enabled;
    downloadBtn.disabled = !enabled;
    saveTxtBtn.disabled = !enabled;
    savePaletteBtn.disabled = !enabled;
}

async function enrichPaletteWithColorInfo(palette) {
    if (!Array.isArray(palette) || !palette.length) return [];

    const enriched = await Promise.all(
        palette.map(async (color) => {
            if (hasColorInfo(color)) {
                return color;
            }

            try {
                const colorInfo = await fetchColorInfo(color.hex);
                return {
                    ...color,
                    persianName: colorInfo?.persianName || "",
                    englishName: colorInfo?.englishName || "",
                    wavelength: colorInfo?.wavelength ?? "",
                    purity: colorInfo?.purity ?? ""
                };
            } catch (error) {
                return {
                    ...color,
                    persianName: color.persianName || "",
                    englishName: color.englishName || "",
                    wavelength: color.wavelength ?? "",
                    purity: color.purity ?? ""
                };
            }
        })
    );

    return enriched;
}

function hasColorInfo(color) {
    return Boolean(
        color &&
        (
            color.persianName ||
            color.englishName ||
            (color.wavelength !== undefined && color.wavelength !== "") ||
            (color.purity !== undefined && color.purity !== "")
        )
    );
}

async function fetchColorInfo(hex) {
    const normalizedHex = String(hex || "").replace("#", "").trim().toLowerCase();
    if (!normalizedHex) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
        const response = await fetch(`https://kopolart.ir/api/color/${normalizedHex}`, {
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            console.warn(`Color API returned status ${response.status} for ${normalizedHex}`);
            return null;
        }
        return await response.json();
    } catch (err) {
        clearTimeout(timeout);
        console.warn(`Color API fetch error for ${normalizedHex}:`, err);
        return null;
    }
}


function getColorLabel(index) {
    const labels = ["رنگ اصلی ۱", "رنگ اصلی ۲", "رنگ زمینه روشن", "رنگ تیره / متن"];
    return labels[index] || `رنگ ${index + 1}`;
}

function renderCurrentPalette(palette) {
    if (!palette || !palette.length) {
        paletteContainer.className = "palette-grid empty";
        paletteContainer.innerHTML = `<div class="empty-state">پالت رنگی یافت نشد</div>`;
        if (contrastBox) contrastBox.style.display = "none";
        return;
    }

    paletteContainer.className = "palette-grid";

    paletteContainer.innerHTML =
        palette
            .map(
                (color, index) => `
    <div class="color-card">
      <div class="color-preview" style="background:${color.hex}"></div>
      <div class="color-body">
        <div class="color-title">${getColorLabel(index)}</div>
        <div class="code-row"><strong>نام فارسی:</strong> ${escapeHtml(color.persianName || "-")}</div>
        <div class="code-row"><strong>نام انگلیسی:</strong> ${escapeHtml(color.englishName || "-")}</div>
        <div class="code-row"><strong>کد هگز:</strong> ${escapeHtml(color.hex)}</div>
        <div class="code-row"><strong>کد RGB:</strong> ${escapeHtml(color.rgb)}</div>
        <div class="code-row"><strong>کد HSL:</strong> ${escapeHtml(color.hsl)}</div>
        <div class="code-row"><strong>طول موج:</strong> ${formatNumber(color.wavelength)}</div>
        <div class="code-row"><strong>خلوص:</strong> ${formatNumber(color.purity)}</div>
        <button class="copy-color-btn" data-color="${escapeHtml(color.hex)}">کپی رنگ</button>
      </div>
    </div>
  `
            )
            .join("") +
        `
    <div class="info-color-link-wrap">
      <a class="info-color-link" title="مجموعه ابزارهای آنلاین گرافیکی کپل آرت" href="https://kopolart.ir/tools" target="_blank" rel="noopener noreferrer">
        مشاهده مجموعه ابزارهای گرافیکی کپل آرت
      </a>
    </div>
  `;

    document.querySelectorAll(".copy-color-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(btn.dataset.color || "");
                flashButtonText(btn, "کپی شد");
            } catch (e) {
                console.error("Copy color failed:", e);
            }
        });
    });
}

// محاسبه و نمایش کنتراست WCAG
function renderContrastAnalysis(palette) {
    if (!contrastBox || !Array.isArray(palette) || palette.length < 4) {
        if (contrastBox) contrastBox.style.display = "none";
        return;
    }

    const lightColor = palette[2]; // رنگ زمینه روشن
    const darkColor = palette[3];  // رنگ تیره / متن

    const rgbLight = hexToRgb(lightColor.hex);
    const rgbDark = hexToRgb(darkColor.hex);

    if (!rgbLight || !rgbDark) {
        contrastBox.style.display = "none";
        return;
    }

    const lumLight = calcLuminance(rgbLight.r, rgbLight.g, rgbLight.b);
    const lumDark = calcLuminance(rgbDark.r, rgbDark.g, rgbDark.b);

    const lighter = Math.max(lumLight, lumDark);
    const darker = Math.min(lumLight, lumDark);
    const ratio = (lighter + 0.05) / (darker + 0.05);
    const ratioFormatted = ratio.toFixed(2);

    contrastSample.style.backgroundColor = lightColor.hex;
    contrastSample.style.color = darkColor.hex;
    contrastRatioText.textContent = `نسبت کنتراست: ${ratioFormatted}:۱`;

    if (ratio >= 7.0) {
        contrastBadge.className = "contrast-badge";
        contrastBadge.textContent = "AAA";
        contrastStatusText.textContent = "عالی (خوانایی بی‌نقص در تمامی ابعاد)";
    } else if (ratio >= 4.5) {
        contrastBadge.className = "contrast-badge aa";
        contrastBadge.textContent = "AA";
        contrastStatusText.textContent = "خوب (مطابق استاندارد متون معمولی)";
    } else if (ratio >= 3.0) {
        contrastBadge.className = "contrast-badge large";
        contrastBadge.textContent = "AA Large";
        contrastStatusText.textContent = "مناسب فقط برای متون درشت یا تیترها";
    } else {
        contrastBadge.className = "contrast-badge fail";
        contrastBadge.textContent = "ضعیف";
        contrastStatusText.textContent = "کنتراست پایین (خوانایی ضعیف متن روی پس‌زمینه)";
    }

    contrastBox.style.display = "block";
}

function calcLuminance(r, g, b) {
    const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

async function copyAllColors(buttonEl) {
    if (!currentPalette) return;

    const text = currentPalette
        .map(
            (c, i) =>
                `${getColorLabel(i)}\nنام فارسی: ${c.persianName || "-"}\nنام انگلیسی: ${c.englishName || "-"}\nکد هگز: ${c.hex}\nکد RGB: ${c.rgb}\nکد HSL: ${c.hsl}\nطول موج: ${formatNumber(c.wavelength)}\nخلوص: ${formatNumber(c.purity)}`
        )
        .join("\n\n");

    try {
        await navigator.clipboard.writeText(text);
        if (buttonEl) flashButtonText(buttonEl, "کپی شد");
    } catch (e) {
        console.error("Copy all failed:", e);
    }
}

// دانلود فایل با ساخت تگ موقت (بدون نیاز به دسترسی Downloads)
function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function downloadJSON() {
    if (!currentPalette || !currentSite) return;

    const payload = {
        site: currentSite,
        createdAt: new Date().toISOString(),
        palette: currentPalette.map((c, i) => ({
            label: getColorLabel(i),
            ...c
        }))
    };

    downloadBlob(
        JSON.stringify(payload, null, 2),
        `${sanitizeFileName(getExportBaseName())}-palette.json`,
        "application/json"
    );
}

function saveTXT() {
    if (!currentPalette || !currentSite) return;

    const year = new Date().getFullYear();

    const text = [
        `پالت رنگ استخراج‌شده با افزونه کپل آرت (kopolart.ir)`,
        ``,
        `سایت: ${currentSite.title || ""}`,
        `آدرس صفحه: ${currentSite.url || ""}`,
        `دامنه: ${currentSite.hostname || ""}`,
        `تاریخ: ${new Date().toLocaleString("fa-IR")}`,
        ``,
        ...currentPalette.map((c, i) => {
            return [
                `${getColorLabel(i)}`,
                `نام فارسی: ${c.persianName || "-"}`,
                `نام انگلیسی: ${c.englishName || "-"}`,
                `کد هگز: ${c.hex}`,
                `کد RGB: ${c.rgb}`,
                `کد HSL: ${c.hsl}`,
                `طول موج: ${formatNumber(c.wavelength)}`,
                `خلوص: ${formatNumber(c.purity)}`,
                ``
            ].join("\n");
        }),
        `---`,
        `© ${year} kopolart.ir - تمامی حقوق محفوظ است.`,
        ``
    ].join("\n");

    downloadBlob(
        text,
        `${sanitizeFileName(getExportBaseName())}-palette.txt`,
        "text/plain;charset=utf-8"
    );
}

async function savePalette() {
    if (!currentPalette || !currentSite) return;

    const data = await chrome.storage.local.get(["savedPalettes"]);
    const saved = data.savedPalettes || [];

    const paletteSignature = createPaletteSignature(currentPalette);
    const siteSignature = createSiteSignature(currentSite);

    const alreadyExists = saved.some((item) => {
        return (
            createSiteSignature(item) === siteSignature &&
            createPaletteSignature(item.palette || []) === paletteSignature
        );
    });

    if (alreadyExists) {
        flashButtonText(savePaletteBtn, "قبلاً ذخیره شده");
        return;
    }

    const item = {
        id: Date.now().toString(),
        site: currentSite.title,
        url: currentSite.url,
        hostname: currentSite.hostname,
        createdAt: new Date().toISOString(),
        palette: currentPalette // اطلاعات کامل و غنی‌شده رنگ‌ها ذخیره می‌شود
    };

    saved.unshift(item);
    await chrome.storage.local.set({ savedPalettes: saved });
    renderSavedPalettes();
    flashButtonText(savePaletteBtn, "ذخیره شد");
}

async function renderSavedPalettes() {
    const query = (searchInput.value || "").trim().toLowerCase();
    const data = await chrome.storage.local.get(["savedPalettes"]);
    let saved = data.savedPalettes || [];

    if (query) {
        saved = saved.filter((item) => {
            const matchSite = (item.site || "").toLowerCase().includes(query);
            const matchHost = (item.hostname || "").toLowerCase().includes(query);
            const matchUrl = (item.url || "").toLowerCase().includes(query);
            const matchHex = (item.palette || []).some((col) =>
                (col.hex || "").toLowerCase().includes(query)
            );
            return matchSite || matchHost || matchUrl || matchHex;
        });
    }

    if (!saved.length) {
        savedPalettesContainer.innerHTML = `<div class="empty-state">موردی یافت نشد</div>`;
        return;
    }

    savedPalettesContainer.innerHTML = saved
        .map(
            (item) => `
    <div class="saved-item">
      <div class="saved-top">
        <div class="saved-site">
          <div class="saved-site-name" title="${escapeHtml(item.hostname || item.site)}">${escapeHtml(
                item.hostname || item.site || "سایت بدون نام"
            )}</div>
        </div>
        <div class="saved-actions">
          <button class="icon-btn" data-action="load" data-id="${item.id}">نمایش</button>
          <button class="icon-btn" data-action="copy" data-id="${item.id}">کپی</button>
          <button class="icon-btn btn-delete" data-action="delete" data-id="${item.id}">حذف</button>
        </div>
      </div>
      <div class="mini-palette">
        ${(item.palette || [])
                    .map(
                        (color) => `
          <div class="mini-swatch" style="background:${color.hex}" title="${escapeHtml(
                            color.hex
                        )}"></div>
        `
                    )
                    .join("")}
      </div>
    </div>
  `
        )
        .join("");

    bindSavedActions();
}

function bindSavedActions() {
    document.querySelectorAll(".icon-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const action = btn.dataset.action;
            const id = btn.dataset.id;

            const data = await chrome.storage.local.get(["savedPalettes"]);
            const saved = data.savedPalettes || [];
            const item = saved.find((x) => x.id === id);
            if (!item) return;

            // نمایش پالت ذخیره شده (بدون نیاز به درخواست اینترنتی مجدد)
            if (action === "load") {
                currentPalette = item.palette || [];
                currentSite = {
                    title: item.site,
                    url: item.url,
                    hostname: item.hostname
                };
                siteLabel.textContent =
                    currentSite.hostname || currentSite.title || "پالت ذخیره‌شده";
                renderCurrentPalette(currentPalette);
                renderContrastAnalysis(currentPalette);
                setActionButtonsState(true);
            }

            // کپی پالت ذخیره شده (سریع و بدون لودینگ شبکه)
            if (action === "copy") {
                const palette = item.palette || [];
                const text = palette
                    .map(
                        (c, i) =>
                            `${getColorLabel(i)}\nنام فارسی: ${c.persianName || "-"}\nنام انگلیسی: ${c.englishName || "-"}\nکد هگز: ${c.hex}\nکد RGB: ${c.rgb}\nکد HSL: ${c.hsl}\nطول موج: ${formatNumber(c.wavelength)}\nخلوص: ${formatNumber(c.purity)}`
                    )
                    .join("\n\n");

                try {
                    await navigator.clipboard.writeText(text);
                    flashButtonText(btn, "کپی شد");
                } catch (e) {
                    console.error("Copy saved palette failed:", e);
                }
            }

            // حذف پالت با دیالوگ تاییدیه
            if (action === "delete") {
                const siteName = item.hostname || item.site || "این پالت";
                const isConfirmed = confirm(`آیا از حذف پالت رنگ "${siteName}" اطمینان دارید؟`);
                if (!isConfirmed) return;

                const updated = saved.filter((x) => x.id !== id);
                await chrome.storage.local.set({ savedPalettes: updated });
                renderSavedPalettes();
            }
        });
    });
}

function getExportBaseName() {
    return currentSite?.hostname || currentSite?.title || "site";
}

function createPaletteSignature(palette) {
    return (palette || [])
        .map((color) => String(color?.hex || "").trim().toUpperCase())
        .join("|");
}

function createSiteSignature(site) {
    return String(site?.hostname || site?.url || site?.site || site?.title || "")
        .trim()
        .toLowerCase();
}

function flashButtonText(button, text, duration = 1500) {
    if (!button) return;

    if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent;
    }

    const originalText = button.dataset.originalText;
    button.textContent = text;
    button.disabled = true;

    clearTimeout(button._flashTimeout);
    button._flashTimeout = setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, duration);
}

function resetButtonText(button) {
    if (!button) return;
    clearTimeout(button._flashTimeout);
    if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
    }
    button.disabled = false;
}

function safeHostname(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "";
    }
}

function sanitizeFileName(name) {
    return (name || "site")
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
        .replace(/\s+/g, "-")
        .replace(/\.+$/g, "")
        .replace(/-+/g, "-")
        .trim();
}

function escapeHtml(str) {
    return String(str || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatNumber(value) {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return escapeHtml(String(value));
    return num.toFixed(2);
}
