/**
 * Static-deployment checks for the production build output.
 * Run after `npm run build`: `npm run test:static`.
 * Dependency-free on purpose — the repo has no test framework.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
let failures = 0;

function check(name, ok) {
  if (ok) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`FAIL  ${name}`);
  }
}

check("dist/ exists (run `npm run build` first)", existsSync(dist));

const robotsPath = join(dist, "robots.txt");
const sitemapPath = join(dist, "sitemap.xml");
check("robots.txt in build output", existsSync(robotsPath));
check("sitemap.xml in build output", existsSync(sitemapPath));

if (existsSync(robotsPath)) {
  const robots = readFileSync(robotsPath, "utf8");
  check("robots.txt: User-agent: *", robots.includes("User-agent: *"));
  check("robots.txt: Allow: /", robots.includes("Allow: /"));
  check(
    "robots.txt: references production sitemap",
    robots.includes("Sitemap: https://carlosrobledo.dev/sitemap.xml"),
  );
  check("robots.txt: no Disallow: /", !/^Disallow: \/\s*$/m.test(robots));
  check("robots.txt: no localhost", !robots.includes("localhost"));
  check("robots.txt: ends with newline", robots.endsWith("\n"));
}

if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, "utf8");
  check("sitemap.xml: XML declaration", sitemap.startsWith('<?xml version="1.0"'));
  // Well-formedness at the level this file needs: every opened tag closes,
  // in order. (No XML parser ships with Node's stdlib.)
  const stack = [];
  let wellFormed = true;
  for (const [, close, name] of sitemap.matchAll(/<(\/?)([a-zA-Z][\w:-]*)[^>]*?>/g)) {
    if (close) {
      if (stack.pop() !== name) wellFormed = false;
    } else {
      stack.push(name);
    }
  }
  check("sitemap.xml: well-formed (tags balance)", wellFormed && stack.length === 0);
  check("sitemap.xml: urlset namespace", sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
  check("sitemap.xml: homepage URL", sitemap.includes("<loc>https://carlosrobledo.dev/</loc>"));
  check("sitemap.xml: resume URL", sitemap.includes("<loc>https://carlosrobledo.dev/resume.html</loc>"));
  check("sitemap.xml: no localhost", !sitemap.includes("localhost"));
  check("sitemap.xml: no changefreq/priority/lastmod", !/changefreq|priority|lastmod/.test(sitemap));
  check("sitemap.xml: ends with newline", sitemap.endsWith("\n"));
}

for (const page of ["index.html", "resume.html"]) {
  const p = join(dist, page);
  if (existsSync(p)) {
    const html = readFileSync(p, "utf8");
    check(`${page}: not noindex`, !/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html));
  } else {
    check(`${page}: present in build output`, false);
  }
}

/* --------------------------------------------------------------------------
   Rebrand guards.

   The portfolio apps are Cadence, Beacon, Lens and Relay. Their former names
   must not survive anywhere a visitor can read them, but Carlos's resume and
   LinkedIn history legitimately describe the real internal tools he built,
   which genuinely were called Rex, Pulse and Gauge. That career history is
   fact and stays. These checks hold both halves of that line at once.
   -------------------------------------------------------------------------- */

const assetsDir = join(dist, "assets");
const bundle = existsSync(assetsDir)
  ? readdirSync(assetsDir)
      .filter((f) => f.endsWith(".js") || f.endsWith(".css"))
      .map((f) => readFileSync(join(assetsDir, f), "utf8"))
      .join("\n")
  : "";

check("bundle: assets found", bundle.length > 0);

if (bundle) {
  // Retired app identities, in every form they were rendered.
  for (const stale of ["@Rex", "Rex Ops", "Recruiting Support", "@Pulse", "@Gauge"]) {
    check(`bundle: no stale label "${stale}"`, !bundle.includes(stale));
  }
  // Retired CSS prefixes; a straggler here means an unstyled or dead rule.
  for (const prefix of ["rex-", "pulse-", "gauge-"]) {
    check(`bundle: no "${prefix}" class prefix`, !bundle.includes(prefix));
  }

  // The current identities, as the interface presents them.
  for (const wanted of [
    "Cadence",
    "@cadence",
    "Recruiting Operations",
    "Keeps recruiting teams informed and workflows moving.",
    "Beacon",
    "Role Intelligence",
    "Lens",
    "Candidate Evaluation",
    "Relay",
    "cad-",
    "Direct message · Interviewer view",
    "Sorry for the delay",
    "A few hours later",
    "Pipeline shape",
    "Priority profile",
    "Next milestone",
    "sudo hire carlos",
    "Technical sourcing ........ PASS",
    "Recommendation: STRONG HIRE",
    "Preparing next step...",
    "Send Carlos a message →",
    "INTERVIEW REQUESTED",
  ]) {
    check(`bundle: contains "${wanted}"`, bundle.includes(wanted));
  }

  // The career-history carve-out: these describe real work and must survive.
  for (const history of ["Designed and built Rex", "Developed Pulse", "Built Gauge"]) {
    check(`bundle: career history preserved — "${history}"`, bundle.includes(history));
  }
}

/* --------------------------------------------------------------------------
   Crawler fallback. index.html must carry real content inside #root so
   crawlers, link previews and JS-less visitors see more than an empty div.
   React replaces it on mount; normal visitors never see it.
   -------------------------------------------------------------------------- */
const indexPath = join(dist, "index.html");
if (existsSync(indexPath)) {
  const html = readFileSync(indexPath, "utf8");
  const root = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<noscript>/)?.[1] ?? "";
  check("index.html: #root has static fallback content", root.trim().length > 200);
  check("index.html: fallback has <h1>Carlos Robledo</h1>", /<h1>\s*Carlos Robledo\s*<\/h1>/.test(root));
  for (const app of ["Cadence", "Beacon", "Lens", "Relay"]) {
    check(`index.html: fallback names ${app}`, root.includes(app));
  }
  check("index.html: fallback links the static resume", root.includes('href="/resume.html"'));
  check("index.html: has <noscript> resume pointer", /<noscript>[\s\S]*resume\.html[\s\S]*<\/noscript>/.test(html));
  for (const tag of ["og:title", "og:description", "og:url", "og:image", "twitter:card"]) {
    const present = html.includes(`property="${tag}"`) || html.includes(`name="${tag}"`);
    // og:image is optional until an image asset exists; report, don't fail.
    if (tag === "og:image") console.log(`  ${present ? "ok " : "-- "} index.html: ${tag} ${present ? "present" : "not set (optional)"}`);
    else check(`index.html: ${tag} present`, present);
  }
}

if (failures > 0) {
  console.error(`\n${failures} static check(s) failed.`);
  process.exit(1);
}
console.log("\nAll static checks passed.");
