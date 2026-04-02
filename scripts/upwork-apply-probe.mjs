import { connectUpworkPage } from './lib/cdp.mjs';

const jobUrl = process.argv[2];

if (!jobUrl) {
  throw new Error('Usage: node scripts/upwork-apply-probe.mjs <job-url>');
}

const { browser, context, page } = await connectUpworkPage();

await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(3000);

const beforeCount = context.pages().length;

const alreadyApplied = await page
  .evaluate(() => /already submitted a proposal/i.test(document.body?.innerText || ''))
  .catch(() => false);

const applyButton = page.getByRole('button', { name: /apply now/i }).first();
const applyButtonExists = (await applyButton.count().catch(() => 0)) > 0;
const applyDisabled = applyButtonExists ? await applyButton.isDisabled().catch(() => false) : null;

let clickedApply = false;

if (!alreadyApplied && applyButtonExists && !applyDisabled) {
  await applyButton.click({ timeout: 20000 });
  clickedApply = true;
}

await page.waitForTimeout(5000);

let proposalPage = page;
if (context.pages().length > beforeCount) {
  proposalPage = context.pages()[context.pages().length - 1];
}

await proposalPage.bringToFront();
await proposalPage.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
await proposalPage.waitForTimeout(3000);

const probe = await proposalPage.evaluate(() => {
  const body = document.body?.innerText || '';
  const labels = Array.from(document.querySelectorAll('label, legend, h1, h2, h3'))
    .map((el) => (el.textContent || '').trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .slice(0, 120);
  const textareas = Array.from(document.querySelectorAll('textarea')).map((el, idx) => ({
    idx,
    placeholder: el.getAttribute('placeholder'),
    name: el.getAttribute('name'),
    id: el.id || null,
  }));
  const inputs = Array.from(document.querySelectorAll('input'))
    .map((el, idx) => ({
      idx,
      type: el.getAttribute('type'),
      placeholder: el.getAttribute('placeholder'),
      name: el.getAttribute('name'),
      id: el.id || null,
      disabled: el.disabled,
      value:
        ['text', 'number', 'email', 'url', null].includes(el.getAttribute('type')) ? el.value : undefined,
    }))
    .slice(0, 80);
  const buttons = Array.from(document.querySelectorAll('button'))
    .map((el) => ({
      text: (el.textContent || '').trim().replace(/\s+/g, ' '),
      disabled: el.disabled,
    }))
    .filter((item) => item.text)
    .slice(0, 80);
  return {
    url: location.href,
    title: document.title,
    connects: (body.match(/Available Connects:?\s*(\d+)/i) || [null, null])[1],
    bodyStart: body.slice(0, 6000),
    labels,
    textareas,
    inputs,
    buttons,
  };
});

console.log(
  JSON.stringify(
    {
      alreadyApplied,
      applyButtonExists,
      applyDisabled,
      clickedApply,
      ...probe,
    },
    null,
    2,
  ),
);

await browser.close();
