import { absoluteUpworkUrl, buildSearchUrl, connectUpworkPage } from './lib/cdp.mjs';

const searchArg = process.argv[2];
const mode = process.argv[3] || 'list';
const indexArg = Number(process.argv[4] || '0');

if (!searchArg) {
  throw new Error('Usage: node scripts/upwork-search-inspect.mjs <search-url-or-keyword> [detail <index>]');
}

const { browser, page } = await connectUpworkPage();
const searchUrl = buildSearchUrl(searchArg);

await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(4000);

async function pickJobCards() {
  const count = await page.locator('article').count();
  const jobs = [];

  for (let i = 0; i < count; i += 1) {
    const article = page.locator('article').nth(i);
    const text = (await article.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    if (!text) continue;

    const title = await article
      .locator('h2, h3, [data-test="job-tile-title-link"]')
      .first()
      .innerText()
      .catch(() => '');
    const href = await article
      .locator('a[href*="/jobs/"], a[href*="/details/~"]')
      .first()
      .getAttribute('href')
      .catch(() => null);

    if (!title) continue;
    jobs.push({ index: i, title: title.trim(), href, text: text.slice(0, 1500) });
  }

  return jobs;
}

const jobs = await pickJobCards();

if (mode === 'list') {
  console.log(
    JSON.stringify(
      {
        page: { title: await page.title(), url: page.url() },
        jobCount: jobs.length,
        jobs: jobs.slice(0, 12),
      },
      null,
      2,
    ),
  );
  await browser.close();
  process.exit(0);
}

const target = jobs[indexArg];

if (!target) {
  throw new Error(`No job found at index ${indexArg}`);
}

if (target.href) {
  await page.goto(absoluteUpworkUrl(target.href), {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
} else {
  const cards = page.locator('article');
  await cards.nth(indexArg).click({ timeout: 20000 }).catch(async () => {
    await cards.nth(indexArg).locator('a, h2, h3').first().click({ timeout: 20000 });
  });
}

await page.waitForTimeout(3500);

const pageData = await page
  .evaluate(() => {
    const h1 = document.querySelector('h1')?.textContent?.trim() || '';
    const h2 = document.querySelector('h2, h3')?.textContent?.trim() || '';
    const body = document.body?.innerText || '';
    return {
      activeTitle: h1 || h2,
      bodyStart: body.slice(0, 8000),
    };
  })
  .catch(() => ({ activeTitle: '', bodyStart: '' }));

console.log(
  JSON.stringify(
    {
      page: { title: await page.title(), url: page.url() },
      target,
      activeTitle: pageData.activeTitle,
      bodyStart: pageData.bodyStart,
    },
    null,
    2,
  ),
);

await browser.close();
