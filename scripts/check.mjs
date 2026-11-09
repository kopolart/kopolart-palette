import { readFile, access } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const readJson = async (rel) => JSON.parse(await readFile(path.join(root, rel), "utf8"));

async function requireFile(rel, label = rel) {
  try {
    await access(path.join(root, rel));
  } catch {
    errors.push(`Missing required file: ${label}`);
  }
}

async function requireText(rel, needle, label) {
  try {
    const text = await readFile(path.join(root, rel), "utf8");
    if (!text.includes(needle)) errors.push(`${label} is missing expected text: "${needle}"`);
  } catch {
    errors.push(`Cannot read ${label}`);
  }
}

const manifest = await readJson("src/manifest.json");
const pkg = await readJson("package.json");

if (manifest.manifest_version !== 3) errors.push("manifest.json must use manifest_version 3");
if (!manifest.name) errors.push("manifest.json is missing a name");
if (!manifest.description) errors.push("manifest.json is missing a description");
if (!/^\d+\.\d+\.\d+$/.test(manifest.version || "")) {
  errors.push("manifest.json version must use MAJOR.MINOR.PATCH");
}
if (manifest.version !== pkg.version) {
  errors.push(`Version mismatch: manifest.json=${manifest.version}, package.json=${pkg.version}`);
}

const popup = manifest.action?.default_popup;
if (!popup) errors.push("manifest.json is missing action.default_popup");

const requiredFiles = [
  "LICENSE",
  "NOTICE",
  "PRIVACY.md",
  "src/LICENSE",
  "src/NOTICE",
  "src/content.js",
  "src/popup.css",
  "src/assets/fonts/OFL.txt",
  "src/assets/fonts/Vazirmatn-Medium.woff2",
  "src/assets/fonts/Vazirmatn-ExtraBold.woff2"
];

if (popup) requiredFiles.push(`src/${popup}`);

for (const icon of Object.values(manifest.icons || {})) {
  requiredFiles.push(`src/${icon}`);
}
for (const icon of Object.values(manifest.action?.default_icon || {})) {
  requiredFiles.push(`src/${icon}`);
}

for (const file of new Set(requiredFiles)) await requireFile(file);

if (popup) {
  const html = await readFile(path.join(root, "src", popup), "utf8");
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const ref = match[1];
    if (/^(https?:|data:|#)/.test(ref) || ref.startsWith("//")) continue;
    await requireFile(path.join("src", ref), `src/${ref} (referenced by ${popup})`);
  }
}

const css = await readFile(path.join(root, "src", "popup.css"), "utf8");
for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  const ref = match[1];
  if (/^(https?:|data:)/.test(ref)) continue;
  await requireFile(path.join("src", ref), `src/${ref} (referenced by popup.css)`);
}

for (const file of ["LICENSE", "NOTICE"]) {
  try {
    const [rootCopy, srcCopy] = await Promise.all([
      readFile(path.join(root, file), "utf8"),
      readFile(path.join(root, "src", file), "utf8")
    ]);
    if (rootCopy !== srcCopy) errors.push(`src/${file} must match ${file}`);
  } catch {
    // Missing files are reported above
  }
}

for (const script of ["src/popup.js", "src/content.js"]) {
  try {
    execFileSync(process.execPath, ["--check", path.join(root, script)], { stdio: "pipe" });
  } catch (error) {
    errors.push(`${script} has a syntax error:\n${error.stderr?.toString() || error.message}`);
  }
}

await requireText("LICENSE", "Attribution 4.0 International", "LICENSE");
await requireText("src/assets/fonts/OFL.txt", "SIL OPEN FONT LICENSE", "font license");
await requireText("NOTICE", "Kopolart Color API", "NOTICE");

if (errors.length) {
  console.error("Repository check failed:\n");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log("Repository check passed");
console.log(`  Name:    ${manifest.name}`);
console.log(`  Version: ${manifest.version}`);
console.log(`  Files:   ${new Set(requiredFiles).size} required files verified`);
