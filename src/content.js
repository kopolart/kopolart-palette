(() => {
    function clamp(v, min, max) {
        return Math.min(max, Math.max(min, v));
    }

    function rgbToHex(r, g, b) {
        return (
            "#" +
            [r, g, b]
                .map((x) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, "0"))
                .join("")
                .toUpperCase()
        );
    }

    function parseColor(color) {
        if (!color) return null;
        color = String(color).trim();

        if (
            !color ||
            color === "transparent" ||
            color === "inherit" ||
            color === "initial" ||
            color === "unset" ||
            color === "currentcolor" ||
            color === "none"
        ) {
            return null;
        }

        const rgbMatch = color.match(
            /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+)\s*)?\)/
        );

        if (rgbMatch) {
            const alpha = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1;
            if (alpha <= 0.04) return null;

            return {
                r: clamp(parseFloat(rgbMatch[1]), 0, 255),
                g: clamp(parseFloat(rgbMatch[2]), 0, 255),
                b: clamp(parseFloat(rgbMatch[3]), 0, 255)
            };
        }

        const hexMatch = color.match(/^#([0-9a-fA-F]{3,8})$/);
        if (hexMatch) {
            let hex = hexMatch[1];

            if (hex.length === 3 || hex.length === 4) {
                hex = hex
                    .slice(0, 3)
                    .split("")
                    .map((c) => c + c)
                    .join("");
            }

            if (hex.length === 6 || hex.length === 8) {
                if (hex.length === 8) {
                    const alpha = parseInt(hex.slice(6, 8), 16) / 255;
                    if (alpha <= 0.04) return null;
                }

                return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16)
                };
            }
        }

        return null;
    }

    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    function relativeLuminance(r, g, b) {
        const srgb = [r, g, b].map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });

        return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    }

    function colorDistance(c1, c2) {
        return Math.sqrt(
            Math.pow(c1.r - c2.r, 2) +
            Math.pow(c1.g - c2.g, 2) +
            Math.pow(c1.b - c2.b, 2)
        );
    }

    function hueDistance(h1, h2) {
        const diff = Math.abs(h1 - h2);
        return Math.min(diff, 360 - diff);
    }

    function isDistinct(color, selected, minDistance = 48, minHueDistance = 24) {
        return selected.every((c) => {
            const rgbDist = colorDistance(color, c);
            const isNearGray = color.hsl.s < 14 || c.hsl.s < 14;

            if (isNearGray) {
                return rgbDist >= Math.max(minDistance - 14, 28);
            }

            const hueDist = hueDistance(color.hsl.h, c.hsl.h);
            return rgbDist >= minDistance || (rgbDist >= 32 && hueDist >= minHueDistance);
        });
    }

    function isElementVisible(el, style, rect) {
        if (!el || !style) return false;
        if (style.display === "none") return false;
        if (style.visibility === "hidden") return false;
        if (parseFloat(style.opacity || "1") <= 0.02) return false;
        if (!rect || rect.width <= 0 || rect.height <= 0) return false;
        return true;
    }

    function getAreaWeight(rect) {
        const area = rect.width * rect.height;
        const viewportArea = Math.max(window.innerWidth * window.innerHeight, 1);
        const normalized = area / viewportArea;

        if (normalized > 1.2) return 16;
        if (normalized > 0.7) return 13;
        if (normalized > 0.35) return 10;
        if (normalized > 0.18) return 7;
        if (normalized > 0.08) return 5;
        if (normalized > 0.03) return 3;
        if (normalized > 0.01) return 2;
        return 1;
    }

    function getVisualWeight(el, rect) {
        const tag = (el.tagName || "").toLowerCase();
        const cls = (el.className || "").toString().toLowerCase();
        const id = (el.id || "").toString().toLowerCase();
        const role = (el.getAttribute("role") || "").toLowerCase();

        let weight = 1 + getAreaWeight(rect);

        if (tag === "button" || role === "button") weight += 8;
        if (tag === "a" || role === "link") weight += 4;
        if (["header", "nav", "footer", "main", "section", "aside"].includes(tag)) weight += 4;
        if (["input", "textarea", "select"].includes(tag)) weight += 2;
        if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) weight += 5;
        if (["svg", "path", "circle", "polygon"].includes(tag)) weight += 3;

        const importantWords = [
            "btn", "button", "primary", "secondary", "accent",
            "hero", "banner", "nav", "menu", "header", "footer",
            "cta", "card", "title", "headline", "logo", "highlight",
            "action", "badge", "tag", "chip"
        ];

        if (importantWords.some((w) => cls.includes(w) || id.includes(w) || role.includes(w))) {
            weight += 5;
        }

        return weight;
    }

    function addColorStat(map, rgb, meta) {
        if (!rgb) return;

        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);

        // Filter out extreme pure whites and pure blacks
        if (lum > 0.998 || lum < 0.002) return;

        if (!map.has(hex)) {
            map.set(hex, {
                r: rgb.r,
                g: rgb.g,
                b: rgb.b,
                hex,
                hsl,
                lum,
                score: 0,
                count: 0,
                bgScore: 0,
                textScore: 0,
                borderScore: 0,
                bgCount: 0,
                textCount: 0,
                borderCount: 0
            });
        }

        const item = map.get(hex);
        const addScore = meta.score || 0;

        item.score += addScore;
        item.count += 1;

        if (meta.role === "background") {
            item.bgScore += addScore;
            item.bgCount += 1;
        } else if (meta.role === "text") {
            item.textScore += addScore;
            item.textCount += 1;
        } else if (meta.role === "border") {
            item.borderScore += addScore;
            item.borderCount += 1;
        }
    }

    function extractGradientColors(gradientStr) {
        if (!gradientStr || !gradientStr.includes("gradient")) return [];

        const colors = [];
        const rgbRegex = /rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)/gi;
        const hexRegex = /#[0-9a-fA-F]{3,8}/gi;

        let match;
        while ((match = rgbRegex.exec(gradientStr)) !== null) {
            const parsed = parseColor(match[0]);
            if (parsed) colors.push(parsed);
        }

        while ((match = hexRegex.exec(gradientStr)) !== null) {
            const parsed = parseColor(match[0]);
            if (parsed) colors.push(parsed);
        }

        return colors;
    }

    function collectRawColors() {
        const colorMap = new Map();

        // 1. Process documentElement & body
        const bodyStyle = document.body ? getComputedStyle(document.body) : null;
        const htmlStyle = document.documentElement ? getComputedStyle(document.documentElement) : null;

        if (htmlStyle) {
            const htmlBg = parseColor(htmlStyle.backgroundColor);
            if (htmlBg) addColorStat(colorMap, htmlBg, { role: "background", score: 24 });
            const htmlText = parseColor(htmlStyle.color);
            if (htmlText) addColorStat(colorMap, htmlText, { role: "text", score: 14 });
        }

        if (bodyStyle) {
            const bodyBg = parseColor(bodyStyle.backgroundColor);
            if (bodyBg) addColorStat(colorMap, bodyBg, { role: "background", score: 30 });
            const bodyText = parseColor(bodyStyle.color);
            if (bodyText) addColorStat(colorMap, bodyText, { role: "text", score: 20 });

            // Check body background gradients
            const bodyGradColors = extractGradientColors(bodyStyle.backgroundImage);
            bodyGradColors.forEach((col) => addColorStat(colorMap, col, { role: "background", score: 22 }));
        }

        // 2. Query visible elements with targeted selector to prevent layout thrashing
        const selector = "body, body *:not(script):not(style):not(noscript):not(link):not(meta):not(iframe)";
        const elements = document.querySelectorAll(selector);
        const maxScan = Math.min(elements.length, 1200);

        for (let i = 0; i < maxScan; i++) {
            const el = elements[i];
            const rect = el.getBoundingClientRect();

            // Skip zero-dimension elements early
            if (rect.width <= 0 || rect.height <= 0) continue;

            const style = getComputedStyle(el);
            if (!isElementVisible(el, style, rect)) continue;

            const weight = getVisualWeight(el, rect);
            const area = rect.width * rect.height;
            const tag = (el.tagName || "").toLowerCase();

            // Check Background Color
            const bgColor = parseColor(style.backgroundColor);
            if (bgColor) {
                let score = weight * 1.8;
                if (area > 0) score += Math.min(area / 50000, 18);
                if (["header", "nav", "main", "section", "aside", "footer"].includes(tag)) {
                    score += 4;
                }
                addColorStat(colorMap, bgColor, { role: "background", score });
            }

            // Check CSS Gradients
            if (style.backgroundImage && style.backgroundImage.includes("gradient")) {
                const gradColors = extractGradientColors(style.backgroundImage);
                gradColors.forEach((col) => {
                    addColorStat(colorMap, col, { role: "background", score: weight * 1.6 + 4 });
                });
            }

            // Check Text Color without innerText reflow (use textContent length)
            const textContent = (el.textContent || "").trim();
            const hasText = textContent.length > 0 && el.children.length <= 2;
            if (hasText) {
                const textColor = parseColor(style.color);
                if (textColor) {
                    let score = weight * 1.4;
                    score += Math.min(textContent.length / 20, 10);
                    if (["h1", "h2", "h3", "h4", "h5", "h6", "a", "button"].includes(tag)) {
                        score += 5;
                    }
                    addColorStat(colorMap, textColor, { role: "text", score });
                }
            }

            // Check Borders (inspect primary border only to avoid 4 redundant calculations)
            const borderColor = parseColor(style.borderColor || style.borderTopColor);
            if (borderColor && parseFloat(style.borderTopWidth || "0") > 0) {
                const score = weight * 0.45;
                addColorStat(colorMap, borderColor, { role: "border", score });
            }

            // Check SVG fill & stroke
            if (["svg", "path", "circle", "rect", "polygon", "g"].includes(tag)) {
                const svgFill = parseColor(style.fill) || parseColor(el.getAttribute("fill"));
                if (svgFill) {
                    addColorStat(colorMap, svgFill, { role: "background", score: weight * 1.5 + 3 });
                }

                const svgStroke = parseColor(style.stroke) || parseColor(el.getAttribute("stroke"));
                if (svgStroke) {
                    addColorStat(colorMap, svgStroke, { role: "border", score: weight * 1.0 + 2 });
                }
            }
        }

        return [...colorMap.values()];
    }

    function mergeSimilarColors(colors, threshold = 26) {
        const sorted = [...colors].sort((a, b) => b.score - a.score);
        const merged = [];

        for (const color of sorted) {
            const existing = merged.find((item) => colorDistance(item, color) <= threshold);

            if (existing) {
                const total = existing.score + color.score;

                existing.r = (existing.r * existing.score + color.r * color.score) / total;
                existing.g = (existing.g * existing.score + color.g * color.score) / total;
                existing.b = (existing.b * existing.score + color.b * color.score) / total;

                existing.score += color.score;
                existing.count += color.count;
                existing.bgScore += color.bgScore;
                existing.textScore += color.textScore;
                existing.borderScore += color.borderScore;
                existing.bgCount += color.bgCount;
                existing.textCount += color.textCount;
                existing.borderCount += color.borderCount;

                existing.hsl = rgbToHsl(existing.r, existing.g, existing.b);
                existing.hex = rgbToHex(existing.r, existing.g, existing.b);
                existing.lum = relativeLuminance(existing.r, existing.g, existing.b);
            } else {
                merged.push({ ...color });
            }
        }

        return merged.map((c) => {
            const vividBoost = c.hsl.s >= 18 ? c.hsl.s * 0.9 : c.hsl.s * 0.2;
            const neutralPenalty = c.hsl.s < 10 ? 8 : 0;

            return {
                ...c,
                finalScore:
                    c.score +
                    c.count * 1.2 +
                    c.bgScore * 0.45 +
                    c.textScore * 0.35 +
                    c.borderScore * 0.12 +
                    vividBoost -
                    neutralPenalty
            };
        }).sort((a, b) => b.finalScore - a.finalScore);
    }

    function isPrimaryCandidate(c) {
        return c.hsl.l >= 18 && c.hsl.l <= 78 && c.hsl.s >= 20;
    }

    function primaryScore(c) {
        const balancedLightnessBonus = 30 - Math.abs(c.hsl.l - 50);
        const saturationBonus = c.hsl.s * 1.6;
        const bgBonus = c.bgScore * 0.35;
        const textBonus = c.textScore * 0.2;
        const usageBonus = c.score * 0.55;
        const grayPenalty = c.hsl.s < 18 ? 30 : 0;

        return balancedLightnessBonus + saturationBonus + bgBonus + textBonus + usageBonus - grayPenalty;
    }

    function isLightCandidate(c) {
        return c.hsl.l >= 72;
    }

    function lightScore(c) {
        const backgroundDominance = c.bgScore * 1.15 + c.bgCount * 3.2;
        const lightnessBonus = c.hsl.l * 1.1;
        const neutralFriendlyBonus = c.hsl.s <= 30 ? 10 : 0;
        const tooVividPenalty = c.hsl.s > 65 ? 12 : 0;

        return backgroundDominance + lightnessBonus + c.score * 0.25 + neutralFriendlyBonus - tooVividPenalty;
    }

    function isDarkCandidate(c) {
        return c.hsl.l <= 32;
    }

    function darkScore(c) {
        const textDominance = c.textScore * 1.05 + c.textCount * 3;
        const darkBonus = (100 - c.hsl.l) * 1.15;
        const bgSupport = c.bgScore * 0.35;
        const neutralFriendlyBonus = c.hsl.s <= 35 ? 8 : 0;

        return textDominance + darkBonus + bgSupport + c.score * 0.22 + neutralFriendlyBonus;
    }

    function pickPrimaryColors(colors) {
        const candidates = colors
            .filter(isPrimaryCandidate)
            .sort((a, b) => primaryScore(b) - primaryScore(a));

        const fallbackCandidates = [...colors].sort((a, b) => primaryScore(b) - primaryScore(a));

        const primary1 = candidates[0] || fallbackCandidates[0] || colors[0];

        let primary2 =
            candidates.find((c) => c.hex !== primary1.hex && isDistinct(c, [primary1], 52, 24)) ||
            fallbackCandidates.find((c) => c.hex !== primary1.hex && isDistinct(c, [primary1], 46, 18)) ||
            fallbackCandidates.find((c) => c.hex !== primary1.hex) ||
            primary1;

        return [primary1, primary2];
    }

    function pickLightTone(colors, usedColors) {
        const candidates = colors
            .filter(isLightCandidate)
            .sort((a, b) => lightScore(b) - lightScore(a));

        const fallback = [...colors].sort((a, b) => lightScore(b) - lightScore(a));

        return (
            candidates.find((c) => isDistinct(c, usedColors, 38, 10)) ||
            candidates[0] ||
            fallback.find((c) => isDistinct(c, usedColors, 34, 8)) ||
            fallback[0] ||
            colors[0]
        );
    }

    function pickDarkTone(colors, usedColors) {
        const candidates = colors
            .filter(isDarkCandidate)
            .sort((a, b) => darkScore(b) - darkScore(a));

        const fallback = [...colors].sort((a, b) => darkScore(b) - darkScore(a));

        return (
            candidates.find((c) => isDistinct(c, usedColors, 38, 10)) ||
            candidates[0] ||
            fallback.find((c) => isDistinct(c, usedColors, 34, 8)) ||
            fallback[0] ||
            colors[colors.length - 1] ||
            colors[0]
        );
    }

    function ensureNoDuplicates(palette, sourceColors) {
        const used = new Set();
        const result = [];

        for (const item of palette) {
            if (!used.has(item.hex)) {
                used.add(item.hex);
                result.push(item);
                continue;
            }

            const replacement = sourceColors.find((c) => !used.has(c.hex));
            if (replacement) {
                used.add(replacement.hex);
                result.push(replacement);
            } else {
                result.push(item);
            }
        }

        return result;
    }

    function formatColor(c, label) {
        const rr = Math.round(c.r);
        const gg = Math.round(c.g);
        const bb = Math.round(c.b);

        return {
            label,
            hex: rgbToHex(rr, gg, bb),
            rgb: `rgb(${rr}, ${gg}, ${bb})`,
            hsl: `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`
        };
    }

    function getFallbackPalette() {
        const fallback = [
            { r: 59, g: 130, b: 246, hsl: rgbToHsl(59, 130, 246) },
            { r: 16, g: 185, b: 129, hsl: rgbToHsl(16, 185, 129) },
            { r: 248, g: 250, b: 252, hsl: rgbToHsl(248, 250, 252) },
            { r: 31, g: 41, b: 55, hsl: rgbToHsl(31, 41, 55) }
        ];

        return [
            formatColor(fallback[0], "رنگ اصلی ۱"),
            formatColor(fallback[1], "رنگ اصلی ۲"),
            formatColor(fallback[2], "رنگ زمینه روشن"),
            formatColor(fallback[3], "رنگ تیره / متن")
        ];
    }

    function extractPalette() {
        const rawColors = collectRawColors();
        const colors = mergeSimilarColors(rawColors);

        if (!colors.length) {
            return getFallbackPalette();
        }

        const [primary1, primary2] = pickPrimaryColors(colors);
        const lightTone = pickLightTone(colors, [primary1, primary2].filter(Boolean));
        const darkTone = pickDarkTone(colors, [primary1, primary2, lightTone].filter(Boolean));

        const selected = ensureNoDuplicates(
            [primary1, primary2, lightTone, darkTone],
            colors
        );

        return [
            formatColor(selected[0], "رنگ اصلی ۱"),
            formatColor(selected[1], "رنگ اصلی ۲"),
            formatColor(selected[2], "رنگ زمینه روشن"),
            formatColor(selected[3], "رنگ تیره / متن")
        ];
    }

    // Message listener for communication with popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message?.type === "PING") {
            sendResponse({ pong: true });
            return;
        }

        if (message?.type === "EXTRACT_PALETTE") {
            try {
                const palette = extractPalette();
                sendResponse({
                    success: true,
                    palette
                });
            } catch (error) {
                console.error("Error extracting palette:", error);
                sendResponse({
                    success: false,
                    message: error?.message || String(error)
                });
            }
        }
    });
})();
