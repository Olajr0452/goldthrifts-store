// Collects every product file in content/products into one data/products.json
// Runs automatically on Netlify (see netlify.toml). Run locally with: node scripts/build.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(root, "content", "products");
const outDir = path.join(root, "data");
const out = path.join(outDir, "products.json");

fs.mkdirSync(src, { recursive: true });
const products = fs
  .readdirSync(src)
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const raw = JSON.parse(fs.readFileSync(path.join(src, f), "utf8"));
    return { id: f.replace(/\.json$/, ""), ...raw };
  })
  .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(out, JSON.stringify(products, null, 2));
console.log(`Wrote ${products.length} products to data/products.json`);
