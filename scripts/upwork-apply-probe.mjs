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
  const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();
  const isUsefulText = (value) => {
    const text = normalize(value);
    if (!text || text.length < 3) return false;
    return !/^(required|optional|type here|answer here|write here|enter here)$/i.test(text);
  };
  const addUnique = (items, value) => {
    const text = normalize(value);
    if (isUsefulText(text) && !items.includes(text)) items.push(text);
  };
  const collectFieldPrompts = (element) => {
    const prompts = [];

    addUnique(prompts, element.getAttribute('aria-label'));

    const labelledBy = normalize(element.getAttribute('aria-labelledby'));
    if (labelledBy) {
      for (const id of labelledBy.split(/\s+/)) {
        const node = document.getElementById(id);
        if (node) addUnique(prompts, node.textContent);
      }
    }

    if (element.labels) {
      for (const label of Array.from(element.labels)) {
        addUnique(prompts, label.textContent);
      }
    }

    if (element.id) {
      const explicitLabel = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      if (explicitLabel) addUnique(prompts, explicitLabel.textContent);
    }

    let current = element;
    for (let depth = 0; current && depth < 4; depth += 1) {
      const scopedNodes = current.querySelectorAll(
        ':scope > label, :scope > legend, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > p, :scope > strong, :scope > span',
      );
      for (const node of Array.from(scopedNodes)) {
        if (!node.contains(element)) addUnique(prompts, node.textContent);
      }

      let sibling = current.previousElementSibling;
      while (sibling) {
        addUnique(prompts, sibling.textContent);
        sibling = sibling.previousElementSibling;
      }

      current = current.parentElement;
    }

    return prompts.slice(0, 3);
  };
  const labels = Array.from(document.querySelectorAll('label, legend, h1, h2, h3'))
    .map((el) => normalize(el.textContent))
    .filter(Boolean)
    .slice(0, 120);
  const textareas = Array.from(document.querySelectorAll('textarea')).map((el, idx) => {
    const prompts = collectFieldPrompts(el);
    return {
      idx,
      placeholder: el.getAttribute('placeholder'),
      name: el.getAttribute('name'),
      id: el.id || null,
      prompt: prompts[0] || null,
      promptAlternates: prompts.slice(1),
    };
  });
  const inputs = Array.from(document.querySelectorAll('input'))
    .map((el, idx) => {
      const prompts = collectFieldPrompts(el);
      return {
        idx,
        type: el.getAttribute('type'),
        placeholder: el.getAttribute('placeholder'),
        name: el.getAttribute('name'),
        id: el.id || null,
        disabled: el.disabled,
        prompt: prompts[0] || null,
        promptAlternates: prompts.slice(1),
        value:
          ['text', 'number', 'email', 'url', null].includes(el.getAttribute('type')) ? el.value : undefined,
      };
    })
    .slice(0, 80);
  const buttons = Array.from(document.querySelectorAll('button'))
    .map((el) => ({
      text: (el.textContent || '').trim().replace(/\s+/g, ' '),
      disabled: el.disabled,
    }))
    .filter((item) => item.text)
    .slice(0, 80);
  const writtenQuestions = Array.from(
    new Set(
      [...textareas, ...inputs]
        .map((field) => field.prompt)
        .filter((value) => isUsefulText(value)),
    ),
  ).slice(0, 40);
  return {
    url: location.href,
    title: document.title,
    connects: (body.match(/Available Connects:?\s*(\d+)/i) || [null, null])[1],
    bodyStart: body.slice(0, 6000),
    labels,
    writtenQuestions,
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
