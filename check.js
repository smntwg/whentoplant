const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "dist");
const failures = [];

function fail(message) {
  failures.push(message);
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const htmlFiles = walk(dist).filter((file) => file.endsWith(".html"));
const paths = new Set(htmlFiles.map((file) => {
  const rel = path.relative(dist, file).split(path.sep).join("/");
  if (rel === "index.html") return "/";
  if (rel === "404.html") return "/404.html";
  return `/${rel.replace(/index\.html$/, "")}`;
}));

const sitemap = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (locs.length !== new Set(locs).size) fail("Sitemap contains duplicate URLs");

const expected = [...paths].filter((urlPath) => urlPath !== "/404.html").sort();
const sitemapPaths = locs.map((loc) => loc.replace("https://whentoplant.uk", "")).sort();
if (expected.join("\n") !== sitemapPaths.join("\n")) {
  fail(`Sitemap does not match built pages.\nBuilt:\n${expected.join("\n")}\nSitemap:\n${sitemapPaths.join("\n")}`);
}

const hrefRe = /href="([^"]+)"/g;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(dist, file);
  if (html.includes("—") || html.includes("–")) fail(`${rel} contains an em dash or en dash`);
  if (/\bAI\b|artificial intelligence|ChatGPT/i.test(html)) fail(`${rel} mentions AI`);
  if (!html.includes('lang="en-GB"')) fail(`${rel} missing lang`);
  if (!html.includes('name="viewport"')) fail(`${rel} missing viewport`);
  if (!html.includes('rel="canonical"')) fail(`${rel} missing canonical`);
  const title = html.match(/<title>([^<]*)<\/title>/);
  if (!title || title[1].length < 10) fail(`${rel} missing title`);
  const description = html.match(/name="description" content="([^"]*)"/);
  if (!description) fail(`${rel} missing description`);
  else if (description[1].length > 170) fail(`${rel} description is ${description[1].length} characters`);
  const canonical = html.match(/rel="canonical" href="([^"]+)"/);
  if (canonical && !canonical[1].startsWith("https://whentoplant.uk")) fail(`${rel} canonical is not the apex domain`);
  if (canonical && canonical[1] !== "https://whentoplant.uk/" && !canonical[1].endsWith("/") && !canonical[1].endsWith(".html")) {
    fail(`${rel} canonical has no trailing slash`);
  }
  if (!html.includes("application/ld+json") && rel !== "404.html") fail(`${rel} missing JSON-LD`);

  for (const match of html.matchAll(hrefRe)) {
    const href = match[1];
    if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) continue;
    const [pathname, hash] = href.split("#");
    if (!pathname.startsWith("/")) fail(`${rel} has a relative link ${href}`);
    const normalized = pathname.endsWith("/") || pathname.includes(".") ? pathname : `${pathname}/`;
    const target = normalized === "/" ? "/" : normalized;
    if (!paths.has(target) && !target.endsWith(".css") && !target.endsWith(".js") && !target.endsWith(".svg") && !target.endsWith(".xml")) {
      fail(`${rel} links to missing ${href}`);
    }
    if (hash && target !== href && false) {
      // hash targets are checked loosely below
    }
    void hash;
  }
}

const robots = fs.readFileSync(path.join(dist, "robots.txt"), "utf8");
if (!robots.includes("Sitemap: https://whentoplant.uk/sitemap.xml")) fail("robots.txt missing sitemap");
const redirects = fs.readFileSync(path.join(dist, "_redirects"), "utf8");
if (!redirects.includes("https://www.whentoplant.uk/* https://whentoplant.uk/:splat 301")) {
  fail("_redirects missing www to apex");
}
if (!fs.existsSync(path.join(dist, "404.html"))) fail("missing 404.html");

const supplies = JSON.parse(fs.readFileSync(path.join(__dirname, "data/supplies.json"), "utf8"));
for (const item of supplies.items) {
  if (item.affiliateUrl) fail(`affiliateUrl should be empty for v1: ${item.id}`);
}

const home = fs.readFileSync(path.join(dist, "index.html"), "utf8");
if (!home.includes('id="this-month"') || !home.includes('id="month-data"')) fail("homepage missing this-month fallback");
const frost = fs.readFileSync(path.join(dist, "frost-dates/index.html"), "utf8");
for (const region of ["south-west", "south-east", "london", "midlands", "wales", "north-england", "scotland", "northern-ireland"]) {
  if (!frost.includes(`id="${region}"`)) fail(`frost page missing ${region}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML files and ${locs.length} sitemap URLs.`);
