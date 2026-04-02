import { connectUpworkPage } from './lib/cdp.mjs';

const { browser, page } = await connectUpworkPage();

await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(2000);

const bodyText = await page.locator('body').innerText().catch(() => '');
const title = await page.title();
const url = page.url();

const connectsMatch = bodyText.match(/Connects:?\s*(\d+)/i);
const loggedIn = /log in to upwork|continue with google|continue with apple/i.test(bodyText) === false;

const headings = await page
  .evaluate(() => {
    const texts = [];
    const nodes = Array.from(document.querySelectorAll('a, h2, h3, h4')).slice(0, 500);
    for (const node of nodes) {
      const text = (node.textContent || '').trim().replace(/\s+/g, ' ');
      if (text && text.length > 4) texts.push(text);
    }
    return texts.slice(0, 80);
  })
  .catch(() => []);

console.log(
  JSON.stringify(
    {
      title,
      url,
      loggedIn,
      connects: connectsMatch ? Number(connectsMatch[1]) : null,
      bodyStart: bodyText.slice(0, 2500),
      headings,
    },
    null,
    2,
  ),
);

await browser.close();
