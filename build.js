const fs = require("fs");
const path = require("path");

const root = __dirname;
const dist = path.join(root, "dist");
const dataDir = path.join(root, "data");

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTH_INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function walkJson(dir) {
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(path.join(dir, name)));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphs(items) {
  return (items || []).map((text) => `<p>${escapeHtml(text)}</p>`).join("\n");
}

function joinList(items) {
  if (!items || items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function monthLabels(numbers) {
  return joinList(numbers.map((n) => MONTH_NAMES[n - 1]));
}

function toneClass(id) {
  if (id === "flower" || id.startsWith("flower")) return "flower";
  if (id === "harvest" || id.startsWith("harvest")) return "harvest";
  if (id === "plant" || id.startsWith("plant")) return "plant";
  return "sow";
}

function resetDist() {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });
}

function writePage(urlPath, html) {
  const rel = urlPath === "/" ? "index.html" : `${urlPath.replace(/^\//, "").replace(/\/$/, "")}/index.html`;
  const file = path.join(dist, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

function leafLogo() {
  return `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="6" fill="#1e6b43"/><path d="M16 26c0-8 6-12 12-13-2 8-7 13-12 13z" fill="#e7f2e4"/><path d="M15 26c0-9-7-14-13-15 3 9 8 15 13 15z" fill="#b7d7b4"/><path d="M16 26V8" stroke="#f4f1e8" stroke-width="1.6" stroke-linecap="round"/></svg>`;
}

function layout(site, page) {
  const title = page.title;
  const description = page.description;
  const canonical = `${site.url}${page.path}`;
  const robots = page.noindex ? `<meta name="robots" content="noindex">` : "";
  const jsonLd = page.jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(page.jsonLd)}</script>`
    : "";
  const scripts = (page.scripts || [])
    .map((src) => `<script src="${src}" defer></script>`)
    .join("\n");
  const extraHead = page.head || "";

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
${robots}
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="${page.ogType || "website"}">
<meta property="og:locale" content="en_GB">
<meta property="og:site_name" content="${escapeHtml(site.name)}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#1e6b43">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..800&family=Mulish:wght@400..800&display=swap">
<link rel="stylesheet" href="/styles.css">
${jsonLd}
${extraHead}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="wordmark" href="/">${leafLogo()}<span>${escapeHtml(site.name)}</span></a>
    <nav class="nav" aria-label="Main">
      <a href="/#months">Months</a>
      <a href="/crops/"${page.path.startsWith("/crops") ? ` aria-current="page"` : ""}>Crops</a>
      <a href="/bulbs/"${page.path.startsWith("/bulbs") ? ` aria-current="page"` : ""}>Bulbs</a>
      <a href="/frost-dates/"${page.path === "/frost-dates/" ? ` aria-current="page"` : ""}>Frost dates</a>
      <a href="/about/"${page.path === "/about/" ? ` aria-current="page"` : ""}>About</a>
    </nav>
  </div>
</header>
${monthSwitch(page)}
<main id="main">
  <div class="wrap">
    ${page.body}
  </div>
</main>
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <p><strong>${escapeHtml(site.name)}</strong> is a UK sowing and harvest calendar. Dates are a guide for British gardens. Check the forecast before you plant anything tender.</p>
      <p>Growing notes are drawn from the RHS, BBC Gardeners' World and the Met Office. Sources are listed on each page.</p>
    </div>
    <ul class="footer-links">
      <li><a href="/crops/">Crops</a></li>
      <li><a href="/bulbs/">Bulbs</a></li>
      <li><a href="/frost-dates/">Frost dates</a></li>
      <li><a href="/about/">About</a></li>
      <li><a href="/privacy/">Privacy</a></li>
      <li><a href="/contact/">Contact</a></li>
    </ul>
  </div>
</footer>
${scripts}
</body>
</html>
`;
}

function monthSwitch(page) {
  const items = MONTH_NAMES.map((name) => {
    const slug = name.toLowerCase();
    const current = page.monthSlug === slug ? ` aria-current="page"` : "";
    return `<li><a href="/${slug}/"${current}>${name}</a></li>`;
  }).join("");
  return `<nav class="month-switch" aria-label="Months"><div class="wrap"><ul>${items}</ul></div></nav>`;
}

function crumbs(items) {
  const html = items.map((item, index) => {
    if (index === items.length - 1) return `<li aria-current="page">${escapeHtml(item.label)}</li>`;
    return `<li><a href="${item.href}">${escapeHtml(item.label)}</a></li>`;
  }).join("");
  return `<nav aria-label="Breadcrumb"><ol class="crumbs">${html}</ol></nav>`;
}

function adSlot(id) {
  return `<!-- ad-slot:${id} Paste ad markup inside this element. It stays hidden while empty. Remove aria-hidden when it has content. -->\n<aside class="ad-slot" data-ad-slot="${escapeHtml(id)}" aria-hidden="true"></aside>`;
}

function chart(rows) {
  const visible = (rows || []).filter((row) => row.months && row.months.length);
  if (!visible.length) return "";
  const used = new Set(visible.map((row) => toneClass(row.id)));
  const legend = [
    used.has("sow") ? `<li><i class="sow" aria-hidden="true"></i>Sow or start</li>` : "",
    used.has("plant") ? `<li><i class="plant" aria-hidden="true"></i>Plant</li>` : "",
    used.has("harvest") ? `<li><i class="harvest" aria-hidden="true"></i>Harvest</li>` : "",
    used.has("flower") ? `<li><i class="flower" aria-hidden="true"></i>In flower</li>` : ""
  ].join("");
  const scale = `<div class="chart-scale" aria-hidden="true"><span></span>${MONTH_INITIALS.map((letter) => `<span>${letter}</span>`).join("")}</div>`;
  const body = visible.map((row) => {
    const tone = toneClass(row.id);
    const cells = MONTH_INITIALS.map((_, index) => {
      const on = row.months.includes(index + 1);
      const title = `${MONTH_NAMES[index]}: ${on ? row.label : "not in this stage"}`;
      return `<span class="cell${on ? ` on ${tone}` : ""}" title="${escapeHtml(title)}"></span>`;
    }).join("");
    return `<div class="chart-row"><span class="chart-label">${escapeHtml(row.label)}</span>${cells}</div>`;
  }).join("");
  const readout = visible.map((row) => {
    const sentence = `${row.label} in ${monthLabels(row.months)}.`;
    return `<li>${escapeHtml(sentence)}${row.detail ? ` ${escapeHtml(row.detail)}` : ""}</li>`;
  }).join("");
  return `<figure class="chart">
  <div class="chart-scroll" aria-hidden="true">${scale}${body}<ul class="legend">${legend}</ul></div>
  <figcaption>
    <ul class="chart-readout">${readout}</ul>
  </figcaption>
</figure>`;
}

function suppliesBox(crop, suppliesById) {
  const items = (crop.supplyIds || []).map((id) => {
    const item = suppliesById.get(id);
    if (!item) throw new Error(`Unknown supply '${id}' on ${crop.slug}`);
    return item;
  });
  if (!items.length) return "";
  const list = items.map((item) => {
    const name = item.affiliateUrl
      ? `<a href="${escapeHtml(item.affiliateUrl)}" rel="sponsored nofollow noopener">${escapeHtml(item.name)}</a>`
      : escapeHtml(item.name);
    return `<li><strong>${name}</strong><p>${escapeHtml(item.detail)}</p></li>`;
  }).join("");
  return `<section class="need" aria-labelledby="need-heading">
  <h2 id="need-heading">What you'll need</h2>
  <p>Kit for this crop, based on the method above.</p>
  <ul>${list}</ul>
</section>`;
}

function sourcesBlock(sources) {
  const items = sources.map((source) => {
    return `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.publisher)}: ${escapeHtml(source.title)}</a>. Checked ${escapeHtml(source.accessed)}.</li>`;
  }).join("");
  return `<section class="sources"><h2>Sources</h2><ol>${items}</ol></section>`;
}

function faqBlock(faqs) {
  if (!faqs || !faqs.length) return "";
  const items = faqs.map((faq) => `<details><summary>${escapeHtml(faq.question)}</summary>${paragraphs(faq.answer)}</details>`).join("");
  return `<section class="faq"><h2>Common questions</h2>${items}</section>`;
}

function taskList(items, cropsBySlug) {
  return `<ul class="tasks">${items.map((item) => {
    const slugs = item.crops || (item.crop ? [item.crop] : []);
    slugs.forEach((slug) => {
      if (!cropsBySlug.has(slug)) throw new Error(`Unknown crop '${slug}' in a month task`);
    });
    const linkedHeading = slugs.length === 1 && item.name === cropsBySlug.get(slugs[0]).name;
    const name = linkedHeading
      ? `<a href="/crops/${slugs[0]}/">${escapeHtml(item.name)}</a>`
      : escapeHtml(item.name);
    const guides = !linkedHeading && slugs.length
      ? `<p class="meta">Guides: ${slugs.map((slug) => `<a href="/crops/${slug}/">${escapeHtml(cropsBySlug.get(slug).name)}</a>`).join(", ")}</p>`
      : "";
    return `<li><h3>${name}</h3><p>${escapeHtml(item.text)}</p>${guides}</li>`;
  }).join("")}</ul>`;
}

function fixBreadcrumbUrls(site, crumbsItems) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbsItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? `${site.url}${item.href}` : undefined
    }))
  };
}

const site = readJson(path.join(dataDir, "site.json"));
const supplies = readJson(path.join(dataDir, "supplies.json"));
const frost = readJson(path.join(dataDir, "frost.json"));
const pages = readJson(path.join(dataDir, "pages.json"));
const crops = walkJson(path.join(dataDir, "crops"));
const months = walkJson(path.join(dataDir, "months")).sort((a, b) => a.number - b.number);
const bulbOrder = ["daffodils", "crocus", "hyacinths", "alliums", "tulips", "snowdrops", "lilies"];
const bulbs = walkJson(path.join(dataDir, "bulbs")).sort((a, b) => bulbOrder.indexOf(a.slug) - bulbOrder.indexOf(b.slug));
const bulbHub = readJson(path.join(dataDir, "bulbs-hub.json"));
const bulbsBySlug = new Map(bulbs.map((bulb) => [bulb.slug, bulb]));
if (bulbs.length < 7) throw new Error(`Expected at least 7 bulbs, found ${bulbs.length}`);

const cropsBySlug = new Map(crops.map((crop) => [crop.slug, crop]));
const suppliesById = new Map(supplies.items.map((item) => [item.id, item]));
if (crops.length < 15) throw new Error(`Expected at least 15 crops, found ${crops.length}`);
if (months.length !== 12) throw new Error(`Expected 12 months, found ${months.length}`);

const built = [];

function addPage(page) {
  const html = layout(site, page);
  writePage(page.path, html);
  if (!page.noindex) built.push({ path: page.path, title: page.title });
}

function org() {
  return { "@type": "Organization", name: site.name, url: `${site.url}/` };
}

resetDist();
fs.copyFileSync(path.join(root, "src/styles.css"), path.join(dist, "styles.css"));
fs.copyFileSync(path.join(root, "src/favicon.svg"), path.join(dist, "favicon.svg"));
for (const f of ["favicon.ico", "apple-touch-icon.png"]) fs.copyFileSync(path.join(root, "src", f), path.join(dist, f));
fs.mkdirSync(path.join(dist, "js"), { recursive: true });
fs.copyFileSync(path.join(root, "src/js/home.js"), path.join(dist, "js/home.js"));
fs.copyFileSync(path.join(root, "src/js/frost.js"), path.join(dist, "js/frost.js"));

const monthCards = months.map((month) => `
  <article class="card">
    <h3><a href="/${month.slug}/">${escapeHtml(month.name)}</a></h3>
    <p>${escapeHtml(month.summary)}</p>
  </article>`).join("");

const cropCards = crops.map((crop) => `
  <article class="card">
    <h3><a href="/crops/${crop.slug}/">${escapeHtml(crop.name)}</a></h3>
    <p>${escapeHtml(crop.summary)}</p>
    <span class="tag">${escapeHtml(crop.card)}</span>
  </article>`).join("");

const bulbCards = bulbs.map((bulb) => `
  <article class="card">
    <h3><a href="/bulbs/${bulb.slug}/">${escapeHtml(bulb.name)}</a></h3>
    <p>${escapeHtml(bulb.summary)}</p>
    <span class="tag">${escapeHtml(bulb.card)}</span>
  </article>`).join("");

const monthData = months.map((month) => ({
  name: month.name,
  path: `/${month.slug}/`,
  summary: month.summary,
  highlights: month.highlights
}));

addPage({
  path: "/",
  title: `${site.name} | UK sowing and harvest calendar`,
  description: site.description,
  scripts: ["/js/home.js"],
  head: `<script type="application/json" id="month-data">${JSON.stringify(monthData)}</script>`,
  jsonLd: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: site.name,
        url: `${site.url}/`,
        description: site.description,
        inLanguage: "en-GB",
        publisher: org()
      }
    ]
  },
  body: `
  <section class="hero">
    <p class="eyebrow">For UK gardens</p>
    <h1>What to sow, plant and harvest</h1>
    <p class="lede">${escapeHtml(site.lede)}</p>
  </section>
  <section class="panel" id="this-month" aria-labelledby="this-month-heading">
    <div id="this-month-panel">
      <p class="eyebrow">This month</p>
      <h2 id="this-month-heading">What to plant this month</h2>
      <p>Choose a month below. If JavaScript is available, this box switches to the current month on your device.</p>
      <p><a class="text-link" href="/#months">Browse all twelve months</a></p>
    </div>
  </section>
  ${adSlot("home")}
  <section id="months">
    <h2>Month by month</h2>
    <p class="section-intro">Each month covers what to sow indoors, sow outdoors, plant out and harvest in UK conditions, plus the jobs that matter that month.</p>
    <div class="grid month-grid">${monthCards}</div>
  </section>
  <section id="crops">
    <h2>Crops</h2>
    <p class="section-intro">Fifteen crops people in the UK search for most often. Open one for spacing, depth, a month chart and the problems worth watching.</p>
    <div class="grid crop-grid">${cropCards}</div>
    <p><a class="button" href="/crops/">All crops</a></p>
  </section>
  <section id="bulbs">
    <h2>Bulbs</h2>
    <p class="section-intro">Spring bulbs go in through autumn, in a set order: daffodils, crocus and hyacinths first, tulips last. Each guide has UK planting months, depth, spacing and aftercare.</p>
    <div class="grid crop-grid">${bulbCards}</div>
    <p><a class="button" href="/bulbs/">When to plant spring bulbs</a></p>
  </section>
  <section class="callout">
    <h2>Frost moves the dates</h2>
    <p>A south-coast garden and a Highland garden are not on the same calendar. Tender crops such as tomatoes, courgettes and sweetcorn should wait until nights are reliably mild.</p>
    <p><a class="button" href="/frost-dates/">Check frost windows</a></p>
  </section>`
});

months.forEach((month, index) => {
  const prev = months[(index + 11) % 12];
  const next = months[(index + 1) % 12];
  const crumbItems = [
    { label: "Home", href: "/" },
    { label: month.name }
  ];
  const sections = month.sections.map((section) => `
    <section>
      <h2>${escapeHtml(section.title)}</h2>
      ${paragraphs(section.intro)}
      ${section.items && section.items.length ? taskList(section.items, cropsBySlug) : ""}
    </section>`).join("");
  const jobs = `<section><h2>Jobs for ${escapeHtml(month.name)}</h2><ul class="jobs">${month.jobs.map((job) => `<li>${escapeHtml(job)}</li>`).join("")}</ul></section>`;
  const hold = month.holdOff ? `<section class="callout"><h2>Leave these for later</h2><ul class="jobs">${month.holdOff.map((job) => `<li>${escapeHtml(job)}</li>`).join("")}</ul></section>` : "";
  const cropLinks = [...new Set(month.sections.flatMap((section) => (section.items || []).flatMap((item) => item.crops || (item.crop ? [item.crop] : []))))]
    .filter((slug) => cropsBySlug.has(slug));
  const related = cropLinks.length
    ? `<section><h2>Crop guides for ${escapeHtml(month.name)}</h2><ul class="related">${cropLinks.map((slug) => `<li><a href="/crops/${slug}/">${escapeHtml(cropsBySlug.get(slug).name)}</a></li>`).join("")}</ul></section>`
    : "";
  const monthBulbs = bulbs.filter((bulb) => (bulb.months || []).includes(month.slug));
  const bulbBlock = monthBulbs.length
    ? `<section><h2>Bulbs to plant in ${escapeHtml(month.name)}</h2><p>Flower bulbs that can go in this month. See <a href="/bulbs/">when to plant spring bulbs</a> for the full order.</p><ul class="related">${monthBulbs.map((bulb) => `<li><a href="/bulbs/${bulb.slug}/">${escapeHtml(bulb.name)}</a></li>`).join("")}</ul></section>`
    : "";
  const faqs = month.faqs || [];
  addPage({
    path: `/${month.slug}/`,
    monthSlug: month.slug,
    title: `${month.name} planting calendar | ${site.name}`,
    description: month.description,
    ogType: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          headline: `What to sow, plant and harvest in ${month.name} in the UK`,
          description: month.description,
          inLanguage: "en-GB",
          dateModified: site.updated,
          author: org(),
          publisher: org(),
          mainEntityOfPage: `${site.url}/${month.slug}/`
        },
        faqs.length ? {
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer.join(" ") }
          }))
        } : null,
        fixBreadcrumbUrls(site, crumbItems.map((item) => ({ ...item, href: item.href || `/${month.slug}/` })))
      ].filter(Boolean)
    },
    body: `
    ${crumbs(crumbItems)}
    <p class="eyebrow">UK month guide</p>
    <h1>${escapeHtml(month.name)}</h1>
    ${paragraphs(month.intro)}
    ${adSlot(`month-${month.slug}`)}
    ${sections}
    ${jobs}
    ${hold}
    ${related}
    ${bulbBlock}
    ${faqBlock(faqs)}
    ${sourcesBlock(month.sources)}
    <nav class="pager" aria-label="Nearby months">
      <a href="/${prev.slug}/">${escapeHtml(prev.name)}</a>
      <a href="/${next.slug}/">${escapeHtml(next.name)}</a>
    </nav>`
  });
});

crops.forEach((crop) => {
  const crumbItems = [
    { label: "Home", href: "/" },
    { label: "Crops", href: "/crops/" },
    { label: crop.name }
  ];
  const section = (id, title, copy) => {
    if (!copy || !copy.length) return "";
    return `<section id="${id}"><h2>${escapeHtml(title)}</h2>${paragraphs(copy)}</section>`;
  };
  const spacing = crop.spacing && crop.spacing.length
    ? `<section><h2>Spacing and depth</h2><dl class="facts">${crop.spacing.map((fact) => `<div><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`).join("")}</dl></section>`
    : "";
  const problems = crop.problems && crop.problems.length
    ? `<section><h2>Common problems</h2>${crop.problems.map((problem) => `<article class="problem"><h3>${escapeHtml(problem.title)}</h3>${paragraphs(problem.text)}</article>`).join("")}</section>`
    : "";
  const monthLinks = (crop.months || []).map((slug) => {
    const month = months.find((item) => item.slug === slug);
    if (!month) throw new Error(`Unknown month '${slug}' on ${crop.slug}`);
    return `<li><a href="/${slug}/">${escapeHtml(month.name)}</a></li>`;
  }).join("");
  const relatedCrops = (crop.related || []).map((slug) => {
    const other = cropsBySlug.get(slug);
    if (!other) throw new Error(`Unknown related crop '${slug}' on ${crop.slug}`);
    return `<li><a href="/crops/${slug}/">${escapeHtml(other.name)}</a></li>`;
  }).join("");
  const steps = (crop.steps || []).map((step, index) => ({
    "@type": "HowToStep",
    position: index + 1,
    name: step.name,
    text: step.text
  }));
  const faqs = crop.faqs || [];
  addPage({
    path: `/crops/${crop.slug}/`,
    title: `${crop.name}: when to sow and harvest in the UK | ${site.name}`,
    description: crop.description,
    ogType: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "HowTo",
          name: `How to grow ${crop.name.toLowerCase()} in the UK`,
          description: crop.description,
          inLanguage: "en-GB",
          totalTime: crop.totalTime || undefined,
          supply: (crop.supplyIds || []).map((id) => ({
            "@type": "HowToSupply",
            name: suppliesById.get(id).name
          })),
          step: steps,
          tool: [{ "@type": "HowToTool", name: "Seed packet or plant label" }]
        },
        faqs.length ? {
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer.join(" ") }
          }))
        } : null,
        fixBreadcrumbUrls(site, crumbItems.map((item, index) => ({
          ...item,
          href: item.href || `/crops/${crop.slug}/`
        })))
      ].filter(Boolean)
    },
    body: `
    ${crumbs(crumbItems)}
    <p class="eyebrow">UK crop guide</p>
    <h1>${escapeHtml(crop.name)}</h1>
    <p class="meta"><span class="latin">${escapeHtml(crop.latin)}</span></p>
    ${paragraphs(crop.intro)}
    ${chart(crop.calendar)}
    <aside class="callout"><p>${escapeHtml(site.timingNote)} <a href="/frost-dates/">See frost windows for your region</a>.</p></aside>
    ${adSlot(`crop-${crop.slug}`)}
    ${section("sow-indoors", "Sow indoors", crop.sowIndoors)}
    ${section("sow-outdoors", "Sow or plant outdoors", crop.sowOutdoors)}
    ${section("plant-out", "Plant out", crop.plantOut)}
    ${spacing}
    ${section("harvest", "Harvest", crop.harvest)}
    ${problems}
    ${suppliesBox(crop, suppliesById)}
    ${faqBlock(faqs)}
    <section>
      <h2>On the calendar</h2>
      <ul class="related">${monthLinks}</ul>
      ${relatedCrops ? `<h3>Related crops</h3><ul class="related">${relatedCrops}</ul>` : ""}
    </section>
    ${sourcesBlock(crop.sources)}`
  });
});

addPage({
  path: "/crops/",
  title: `Crop guides | ${site.name}`,
  description: "UK growing guides for potatoes, tomatoes, garlic, onions, carrots and ten more crops, with sowing, planting and harvest months.",
  jsonLd: {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: "Crop guides", url: `${site.url}/crops/`, isPartOf: `${site.url}/` },
      fixBreadcrumbUrls(site, [
        { label: "Home", href: "/" },
        { label: "Crops", href: "/crops/" }
      ])
    ]
  },
  body: `
  ${crumbs([{ label: "Home", href: "/" }, { label: "Crops" }])}
  <p class="eyebrow">UK crop guides</p>
  <h1>Crops</h1>
  <p class="lede">Start with the crop you want to eat. Each guide has UK sowing and harvest months, spacing, depth and the problems the RHS flags for that plant.</p>
  <div class="grid crop-grid">${cropCards}</div>`
});

function affiliatePlaceholder(id) {
  // Neutral marker only. When a real affiliate link replaces a slot, also add the small muted top note
  // "This page contains affiliate links." to that page. No link, no note.
  return `<!-- affiliate-slot:${id} -->`;
}

function faqSchema(faqs) {
  return faqs.length ? {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer.join(" ") }
    }))
  } : null;
}

bulbs.forEach((bulb) => {
  const crumbItems = [
    { label: "Home", href: "/" },
    { label: "Bulbs", href: "/bulbs/" },
    { label: bulb.name }
  ];
  const section = (id, title, copy) => {
    if (!copy || !copy.length) return "";
    return `<section id="${id}"><h2>${escapeHtml(title)}</h2>${paragraphs(copy)}</section>`;
  };
  const facts = bulb.spacing && bulb.spacing.length
    ? `<dl class="facts">${bulb.spacing.map((fact) => `<div><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`).join("")}</dl>`
    : "";
  const problems = bulb.problems && bulb.problems.length
    ? `<section><h2>Common problems</h2>${bulb.problems.map((problem) => `<article class="problem"><h3>${escapeHtml(problem.title)}</h3>${paragraphs(problem.text)}</article>`).join("")}</section>`
    : "";
  const monthLinks = (bulb.months || []).map((slug) => {
    const month = months.find((item) => item.slug === slug);
    if (!month) throw new Error(`Unknown month '${slug}' on bulb ${bulb.slug}`);
    return `<li><a href="/${slug}/">${escapeHtml(month.name)}</a></li>`;
  }).join("");
  const relatedBulbs = (bulb.related || []).map((slug) => {
    const other = bulbsBySlug.get(slug);
    if (!other) throw new Error(`Unknown related bulb '${slug}' on ${bulb.slug}`);
    return `<li><a href="/bulbs/${slug}/">${escapeHtml(other.name)}</a></li>`;
  }).join("");
  const faqs = bulb.faqs || [];
  addPage({
    path: `/bulbs/${bulb.slug}/`,
    title: `When to plant ${bulb.name.toLowerCase()} in the UK | ${site.name}`,
    description: bulb.description,
    ogType: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          headline: `When to plant ${bulb.name.toLowerCase()} in the UK`,
          description: bulb.description,
          inLanguage: "en-GB",
          dateModified: site.updated,
          author: org(),
          publisher: org(),
          mainEntityOfPage: `${site.url}/bulbs/${bulb.slug}/`
        },
        faqSchema(faqs),
        fixBreadcrumbUrls(site, crumbItems.map((item) => ({ ...item, href: item.href || `/bulbs/${bulb.slug}/` })))
      ].filter(Boolean)
    },
    body: `
    ${crumbs(crumbItems)}
    <p class="eyebrow">UK bulb guide</p>
    <h1>When to plant ${escapeHtml(bulb.name.toLowerCase())}</h1>
    <p class="meta"><span class="latin">${escapeHtml(bulb.latin)}</span></p>
    ${paragraphs(bulb.intro)}
    ${chart(bulb.calendar)}
    <aside class="callout"><p>${escapeHtml(site.timingNote)} <a href="/frost-dates/">See frost windows for your region</a>.</p></aside>
    ${adSlot(`bulb-${bulb.slug}`)}
    ${section("when", "When to plant in the UK", bulb.timing)}
    ${section("where", "Where to plant and soil", bulb.where)}
    <section id="how"><h2>How to plant: depth and spacing</h2>${facts}${paragraphs(bulb.planting)}</section>
    ${affiliatePlaceholder(`bulb-${bulb.slug}`)}
    ${section("pots", "In pots", bulb.pots)}
    ${section("aftercare", "Aftercare", bulb.aftercare)}
    ${problems}
    ${faqBlock(faqs)}
    <section>
      <h2>On the calendar</h2>
      <ul class="related">${monthLinks}</ul>
      ${relatedBulbs ? `<h3>Other bulbs</h3><ul class="related">${relatedBulbs}</ul>` : ""}
      <p><a class="text-link" href="/bulbs/">When to plant spring bulbs: the full order</a></p>
    </section>
    ${sourcesBlock(bulb.sources)}`
  });
});

{
  const hubCrumbs = [{ label: "Home", href: "/" }, { label: "Bulbs" }];
  const monthBlocks = bulbHub.months.map((item) => {
    const links = item.bulbs.map((slug) => {
      const bulb = bulbsBySlug.get(slug);
      if (!bulb) throw new Error(`Unknown bulb '${slug}' on the bulb hub`);
      return `<li><a href="/bulbs/${slug}/">${escapeHtml(bulb.name)}</a></li>`;
    }).join("");
    return `<article class="card"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.text)}</p><ul class="related">${links}</ul></article>`;
  }).join("");
  const glance = bulbs.map((bulb) => {
    const plantRow = bulb.calendar.find((row) => toneClass(row.id) === "plant");
    return `<article class="card"><h3><a href="/bulbs/${bulb.slug}/">${escapeHtml(bulb.name)}</a></h3><p>${escapeHtml(bulb.summary)}</p><dl class="glance">${bulb.spacing.map((fact) => `<div><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`).join("")}</dl><span class="tag">${escapeHtml(bulb.card)}</span></article>`;
  }).join("");
  const rules = bulbHub.rules.map((block) => `<section><h3>${escapeHtml(block.heading)}</h3>${paragraphs(block.paragraphs)}</section>`).join("");
  addPage({
    path: bulbHub.path,
    title: `${bulbHub.title} | ${site.name}`,
    description: bulbHub.description,
    ogType: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          headline: bulbHub.title,
          description: bulbHub.description,
          inLanguage: "en-GB",
          dateModified: site.updated,
          author: org(),
          publisher: org(),
          mainEntityOfPage: `${site.url}${bulbHub.path}`
        },
        faqSchema(bulbHub.faqs),
        fixBreadcrumbUrls(site, [{ label: "Home", href: "/" }, { label: "Bulbs", href: bulbHub.path }])
      ].filter(Boolean)
    },
    body: `
    ${crumbs(hubCrumbs)}
    <p class="eyebrow">UK bulb guide</p>
    <h1>${escapeHtml(bulbHub.title)}</h1>
    ${paragraphs(bulbHub.intro)}
    ${adSlot("bulbs-hub")}
    <section><h2>Month by month</h2><div class="grid">${monthBlocks}</div></section>
    <section><h2>Bulbs at a glance</h2><p class="section-intro">Planting months, depth and spacing for each bulb. Open a guide for soil, pots, aftercare and problems.</p><div class="grid crop-grid">${glance}</div></section>
    ${affiliatePlaceholder("bulbs-hub")}
    <section><h2>The rules that apply to almost every bulb</h2>${rules}</section>
    ${faqBlock(bulbHub.faqs)}
    ${sourcesBlock(bulbHub.sources)}`
  });
}

function frostDaysTable(region) {
  if (!region.frostDays) {
    return `<p>${escapeHtml(region.frostNote)}</p>`;
  }
  const rows = [
    ["April", region.frostDays.apr],
    ["May", region.frostDays.may],
    ["June", region.frostDays.jun],
    ["September", region.frostDays.sep],
    ["October", region.frostDays.oct],
    ["November", region.frostDays.nov]
  ];
  return `<table class="stat-table">
    <caption>Average air-frost days, ${escapeHtml(region.seriesName)}, 1991 to 2020</caption>
    <thead><tr><th scope="col">Month</th><th scope="col">Air-frost days</th></tr></thead>
    <tbody>${rows.map(([month, days]) => `<tr><th scope="row">${month}</th><td>${escapeHtml(days)}</td></tr>`).join("")}</tbody>
  </table>
  <p class="meta">${escapeHtml(region.seriesNote)}</p>`;
}

function regionCard(region) {
  return `<article class="region-card" id="${escapeHtml(region.id)}" data-region="${escapeHtml(region.id)}" data-name="${escapeHtml(region.name)}">
    <h2>${escapeHtml(region.name)}</h2>
    <p class="meta">${escapeHtml(region.covers)}</p>
    <h3>Last spring air frost</h3>
    <p>${escapeHtml(region.lastWindow)}</p>
    <h3>First autumn air frost</h3>
    <p>${escapeHtml(region.firstWindow)}</p>
    ${frostDaysTable(region)}
    <h3>When the RHS would plant out tender crops</h3>
    <p>${escapeHtml(region.plantOut)}</p>
    <h3>What this means for sowing</h3>
    <p>${escapeHtml(region.sowingNote)}</p>
  </article>`;
}

const regionOptions = frost.regions.map((region) => `<option value="${escapeHtml(region.id)}">${escapeHtml(region.name)}</option>`).join("");
const regionPicks = frost.regions.map((region) => `<li><a href="#${escapeHtml(region.id)}">${escapeHtml(region.name)}</a></li>`).join("");
const regionCards = frost.regions.map(regionCard).join("");

addPage({
  path: "/frost-dates/",
  title: `UK frost dates by region | ${site.name}`,
  description: "Approximate last and first air-frost windows for UK regions, plus RHS planting-out times for tender crops. Not a forecast.",
  scripts: ["/js/frost.js"],
  jsonLd: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: frost.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer.join(" ") }
        }))
      },
      fixBreadcrumbUrls(site, [
        { label: "Home", href: "/" },
        { label: "Frost dates", href: "/frost-dates/" }
      ])
    ]
  },
  body: `
  ${crumbs([{ label: "Home", href: "/" }, { label: "Frost dates" }])}
  <p class="eyebrow">Approximate, not a forecast</p>
  <h1>Frost dates in the UK</h1>
  ${paragraphs(frost.intro)}
  <form class="panel frost-form" id="frost-form">
    <div>
      <label for="region">Nearest area</label>
      <p class="meta" id="region-hint">Pick the region that best matches your garden. Every region is also written out below, so the page still works if JavaScript is off.</p>
    </div>
    <ul class="related" id="region-picks">${regionPicks}</ul>
    <select id="region" name="region" aria-describedby="region-hint">
      <option value="">Or choose from the list</option>
      ${regionOptions}
    </select>
    <button type="submit">Show this region</button>
  </form>
  <div id="frost-result" class="panel" hidden></div>
  <section>
    <h2>All regions</h2>
    <div class="grid">${regionCards}</div>
  </section>
  ${faqBlock(frost.faqs)}
  ${sourcesBlock(frost.sources)}`
});

function prosePage(key, schemaType) {
  const page = pages[key];
  const body = page.blocks.map((block) => {
    return `<section><h2>${escapeHtml(block.heading)}</h2>${paragraphs(block.paragraphs)}</section>`;
  }).join("");
  addPage({
    path: page.path,
    title: `${page.title} | ${site.name}`,
    description: page.description,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": schemaType,
          name: page.title,
          url: `${site.url}${page.path}`,
          description: page.description,
          isPartOf: `${site.url}/`,
          inLanguage: "en-GB"
        },
        fixBreadcrumbUrls(site, [
          { label: "Home", href: "/" },
          { label: page.title, href: page.path }
        ])
      ]
    },
    body: `
    ${crumbs([{ label: "Home", href: "/" }, { label: page.title }])}
    <h1>${escapeHtml(page.title)}</h1>
    ${paragraphs(page.intro)}
    ${body}`
  });
}

prosePage("about", "AboutPage");
prosePage("privacy", "WebPage");
prosePage("contact", "ContactPage");

const notFound = {
  path: "/404.html",
  noindex: true,
  title: `Page not found | ${site.name}`,
  description: "That page is not on the UK planting calendar.",
  body: `
  <h1>Page not found</h1>
  <p>That address is not on this site. Try the month you are in, or look up a crop.</p>
  <p><a class="button" href="/">Back to the calendar</a></p>
  <div class="grid month-grid">${monthCards}</div>`
};
fs.writeFileSync(path.join(dist, "404.html"), layout(site, notFound));

const urls = built.map((page) => `  <url><loc>${site.url}${page.path}</loc><lastmod>${site.updated}</lastmod></url>`).join("\n");
fs.writeFileSync(path.join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);

// www to apex is handled by functions/_middleware.js, because _redirects
// cannot match on hostname.
const redirects = [
  ...built
    .map((page) => page.path)
    .filter((urlPath) => urlPath !== "/")
    .map((urlPath) => `${urlPath.replace(/\/$/, "")} ${urlPath} 301`)
];
fs.writeFileSync(path.join(dist, "_redirects"), `${redirects.join("\n")}\n`);

fs.writeFileSync(path.join(dist, "_headers"), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n`);

console.log(`Built ${built.length} pages in dist/`);
