#!/usr/bin/env node
/**
 * Template Upload Converter CLI
 *
 * Takes a downloaded HTML template ZIP, extracts it, generates a preview
 * screenshot, uploads to Supabase storage, and seeds the shop_templates table.
 *
 * Usage:
 *   node scripts/convert-template.mjs <path-to-zip> --name "Template Name" --type seller
 *
 * Options:
 *   --name    Template display name (required)
 *   --type    Shop type: doctor, seller, factory, middleman (required)
 *   --slug    URL slug (auto-generated from name if omitted)
 *   --status  Template status: active, draft (default: draft)
 */

import { createClient } from "@supabase/supabase-js";
import {
  readFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  readdirSync,
  statSync,
} from "fs";
import { join, resolve, dirname } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === "win32";

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const STORAGE_BUCKET = "template-uploads";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── CLI Arg Parsing ─────────────────────────────────────────────────────────
function parseArgs(args) {
  const result = {
    zipPath: null,
    name: null,
    type: null,
    slug: null,
    status: "draft",
  };

  // First non-flag arg is the zip path
  let i = 0;
  if (args.length > 0 && !args[0].startsWith("--")) {
    result.zipPath = args[0];
    i = 1;
  }

  while (i < args.length) {
    switch (args[i]) {
      case "--name":
        result.name = args[++i];
        break;
      case "--type":
        result.type = args[++i];
        break;
      case "--slug":
        result.slug = args[++i];
        break;
      case "--status":
        result.status = args[++i];
        break;
      case "--help":
        console.log(`
Template Upload Converter
=========================
Converts a downloaded HTML template ZIP into a marketplace-ready template.

Usage:
  node scripts/convert-template.mjs <zip-path> --name "Name" --type <type>

Options:
  --name    Template display name (required)
  --type    Shop type: doctor, seller, factory, middleman (required)
  --slug    URL slug (auto-generated from name if omitted)
  --status  Template status: active, draft (default: draft)
  --help    Show this help

Examples:
  node scripts/convert-template.mjs ./templates/my-shop.zip --name "Modern Shop" --type seller
  node scripts/convert-template.mjs ./doctor.zip --name "Medical Pro" --type doctor --status active
        `);
        process.exit(0);
    }
    i++;
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));

// ── Validation ──────────────────────────────────────────────────────────────
const VALID_TYPES = ["doctor", "seller", "factory", "middleman"];
const VALID_STATUSES = ["draft", "active"];

if (!args.zipPath) {
  console.error("❌ ZIP file path required as first argument");
  process.exit(1);
}
if (!args.name) {
  console.error("❌ --name is required");
  process.exit(1);
}
if (!args.type || !VALID_TYPES.includes(args.type)) {
  console.error(`❌ --type must be one of: ${VALID_TYPES.join(", ")}`);
  process.exit(1);
}
if (!VALID_STATUSES.includes(args.status)) {
  console.error(`❌ --status must be one of: ${VALID_STATUSES.join(", ")}`);
  process.exit(1);
}

const zipPath = resolve(args.zipPath);
if (!existsSync(zipPath)) {
  console.error(`❌ File not found: ${zipPath}`);
  process.exit(1);
}

const slug =
  args.slug ||
  args.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
const extractDir = join(__dirname, "..", "temp-template-extract");

// ── Main Pipeline ───────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📦 Template Upload Converter`);
  console.log(`   File: ${zipPath}`);
  console.log(`   Name: ${args.name}`);
  console.log(`   Type: ${args.type}`);
  console.log(`   Slug: ${slug}`);
  console.log(`   Status: ${args.status}\n`);

  // Step 1: Extract ZIP
  console.log("📂 Step 1: Extracting template...");
  if (existsSync(extractDir))
    rmSync(extractDir, { recursive: true, force: true });
  mkdirSync(extractDir, { recursive: true });

  try {
    if (isWindows) {
      // Use PowerShell Expand-Archive on Windows
      execSync(
        `powershell -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force"`,
        { stdio: "pipe" },
      );
    } else {
      execSync(`unzip -o "${zipPath}" -d "${extractDir}"`, { stdio: "pipe" });
    }
    console.log("   ✅ Extracted");
  } catch (err) {
    console.error("   ❌ Failed to extract ZIP.");
    console.error("      Windows: Ensure PowerShell is available");
    console.error("      Linux/Mac: Ensure unzip is installed");
    process.exit(1);
  }

  // Step 2: Find the main HTML file
  console.log("🔍 Step 2: Finding main HTML file...");
  const htmlFile = findHtmlFile(extractDir);
  if (!htmlFile) {
    console.error("   ❌ No HTML file found in template");
    cleanup();
    process.exit(1);
  }
  const relativeHtml = htmlFile
    .replace(extractDir + "\\", "")
    .replace(extractDir + "/", "");
  console.log(`   ✅ Found: ${relativeHtml}`);

  // Step 3: Generate preview screenshot
  console.log("📸 Step 3: Generating preview screenshot...");
  const previewPath = await generatePreview(htmlFile);
  if (previewPath) {
    console.log(`   ✅ Preview saved`);
  } else {
    console.log(
      "   ⚠️  Skipping preview (install puppeteer for auto-screenshots)",
    );
    console.log("      Tip: npm install puppeteer");
  }

  // Step 4: Upload to Supabase Storage
  console.log("☁️  Step 4: Uploading to Supabase Storage...");

  // Upload preview image
  let previewUrl = null;
  if (previewPath && existsSync(previewPath)) {
    const previewFileName = `previews/${Date.now()}_${slug}.png`;
    const previewData = readFileSync(previewPath);
    const { data: prevRes, error: prevErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(previewFileName, previewData, {
        contentType: "image/png",
        upsert: false,
      });

    if (prevErr) {
      console.error(`   ⚠️  Preview upload failed: ${prevErr.message}`);
    } else {
      const { data: publicUrl } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(prevRes.path);
      previewUrl = publicUrl.publicUrl;
      console.log(`   ✅ Preview uploaded`);
    }
  }

  // Upload template ZIP
  const zipFileName = `templates/${Date.now()}_${slug}.zip`;
  const zipData = readFileSync(zipPath);
  const { data: zipRes, error: zipErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(zipFileName, zipData, {
      contentType: "application/zip",
      upsert: false,
    });

  if (zipErr) {
    console.error(`   ❌ ZIP upload failed: ${zipErr.message}`);
    cleanup();
    process.exit(1);
  }
  console.log(`   ✅ Template ZIP uploaded`);

  // Step 5: Seed database
  console.log("💾 Step 5: Seeding shop_templates table...");
  const { data: template, error: dbErr } = await supabase
    .from("shop_templates")
    .insert({
      name: args.name,
      slug,
      shop_type: args.type,
      preview_image_url: previewUrl,
      template_data: {
        source_path: zipRes.path,
        main_html_file: relativeHtml,
        extracted_files: countFiles(extractDir),
      },
      status: args.status,
      is_custom: false,
    })
    .select()
    .single();

  if (dbErr) {
    console.error(`   ❌ Database insert failed: ${dbErr.message}`);
    cleanup();
    process.exit(1);
  }

  console.log(`   ✅ Template seeded to database`);
  console.log(`\n🎉 Done! Template "${args.name}" is now available.`);
  console.log(`   ID: ${template.id}`);
  console.log(`   Status: ${template.status}`);
  if (previewUrl) console.log(`   Preview: ${previewUrl}`);

  // Cleanup
  cleanup();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function findHtmlFile(dir) {
  const priorityFiles = [
    "index.html",
    "home.html",
    "main.html",
    "default.html",
  ];

  // First pass: look for priority files
  try {
    const entries = readdirSync(dir);
    for (const name of priorityFiles) {
      const fullPath = join(dir, name);
      if (existsSync(fullPath)) return fullPath;
    }

    // Second pass: look in subdirectories (one level deep)
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        for (const name of priorityFiles) {
          const subPath = join(fullPath, name);
          if (existsSync(subPath)) return subPath;
        }
      }
    }

    // Third pass: find any .html file
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (entry.endsWith(".html")) return fullPath;
      if (statSync(fullPath).isDirectory()) {
        const subEntries = readdirSync(fullPath);
        for (const sub of subEntries) {
          if (sub.endsWith(".html")) return join(fullPath, sub);
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

async function generatePreview(htmlFile) {
  const outputPath = join(__dirname, "..", "temp-preview.png");

  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`file://${htmlFile}`, {
      waitUntil: "networkidle0",
      timeout: 10000,
    });
    await page.screenshot({ path: outputPath, fullPage: false });
    await browser.close();
    return outputPath;
  } catch {
    // Puppeteer not available
    return null;
  }
}

function countFiles(dir) {
  let count = 0;
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        count += countFiles(fullPath);
      } else {
        count++;
      }
    }
  } catch {
    // ignore
  }
  return count;
}

function cleanup() {
  if (existsSync(extractDir)) {
    rmSync(extractDir, { recursive: true, force: true });
    console.log("🧹 Cleaned up temp files");
  }
  const previewPath = join(__dirname, "..", "temp-preview.png");
  if (existsSync(previewPath)) {
    rmSync(previewPath, { force: true });
  }
}

// ── Run ─────────────────────────────────────────────────────────────────────
main().catch((err) => {
  console.error("💥 Fatal error:", err.message);
  cleanup();
  process.exit(1);
});
