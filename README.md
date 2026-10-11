# When to plant

UK sowing and harvest calendar for [whentoplant.uk](https://whentoplant.uk). The site says what to sow, plant out and harvest each month in British conditions, and it has growing notes for the crops people look up most often.

Pages are generated from the JSON files in `data/`. Change the content there, then build. Do not edit files in `dist/` by hand.

## Build

Requires Node.js 20 or newer.

```bash
npm run build
```

The static site is written to `dist/`. Check links, the sitemap and canonical tags with:

```bash
npm run check
```

Cloudflare Pages, deploying from `main`:

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

`dist/_redirects` sends `www.whentoplant.uk` to `https://whentoplant.uk`. Canonical URLs use the apex domain and a trailing slash.

## Pages

- `/` homepage, with a this-month panel that follows the visitor's date
- `/january/` through `/december/`
- `/crops/` and one page each for potatoes, tomatoes, garlic, onions, carrots, runner beans, broad beans, peas, lettuce, courgettes, strawberries, beetroot, cabbage, sweetcorn and leeks
- `/frost-dates/`
- `/about/`
- `/privacy/`
- `/contact/`
- `404.html`, `sitemap.xml`, `robots.txt`

## Add a crop

1. Copy `data/crops/beetroot.json` to `data/crops/your-crop.json`.
2. Set `slug` to the same name as the file, without `.json`. The page is published at `/crops/your-crop/`.
3. Fill the intro, calendar months (1 to 12), spacing, harvest, problems, FAQs and sources. Use UK guidance and cite the page you took the figure from. Leave a section out by omitting the field, rather than writing a vague paragraph.
4. Add any new kit to `data/supplies.json` and list its `id` in `supplyIds`. Set `affiliateUrl` to `""` until there is a real link. One edit in that file updates every crop that uses the item.
5. Mention the crop on the month pages where it is sown or harvested: add an item with `"crop": "your-crop"` in `data/months/`.
6. Run `npm run check`. The new page is added to the homepage, the crops index, the sitemap and the internal links on its own.

## Update a month

Edit `data/months/march.json` (or whichever month). `summary` and `highlights` are what the homepage shows for that month. `sections` are sow indoors, sow outdoors, plant out and harvest. `jobs` and `holdOff` are the practical notes. Run `npm run check` before you commit.

## Shop links and ad slots

`data/supplies.json` is the only place affiliate URLs live. An empty `affiliateUrl` renders as plain text, so the "What you'll need" box is a kit list and not a row of dead buttons.

Ad slots are empty `<aside class="ad-slot">` elements. They stay hidden while they have no content. To switch one on, put the ad markup inside the element in `build.js` (search for `ad-slot:`) and remove `aria-hidden`.
