/** Rebuild homepage images from the running app, using browser-only demo data.
 * No accounts, posts, uploads or connected channels are created.
 * Run: node site/scripts/capture-product.mjs [http://localhost:8088]
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const origin = process.argv[2] || 'http://localhost:8088';
const output = path.resolve('site/img/product');
await mkdir(output, { recursive: true });
const campaigns = [
  ['The weekend edit', 'Small moments.\nGood company.', '#A5EDD6'],
  [
    'Fresh perspectives',
    'A little inspiration\nfor your next chapter.',
    '#FFE27A',
  ],
  ['Made for Monday', 'Start the week\nwith something good.', '#FFC4D8'],
  ['Behind the scenes', 'Meet the people\nbehind the work.', '#B8DBFF'],
  ['Something new', 'New ideas.\nSame thoughtful craft.', '#FFCDA3'],
  ['Save the date', 'Make room for\nsomething special.', '#DCD3F4'],
];
for (let i = 0; i < campaigns.length; i++) {
  const [title, copy, color] = campaigns[i];
  await writeFile(
    path.join(output, `campaign-${i}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="960" viewBox="0 0 960 960"><rect width="960" height="960" fill="${color}"/><circle cx="810" cy="130" r="260" fill="#FFFEFB" opacity=".45"/><path d="M-80 800 Q400 350 1040 880 L1040 1040 H-80Z" fill="#0F6B52"/><text x="72" y="104" fill="#1F3329" font-family="sans-serif" font-size="24" font-weight="600">STUDIO NOTES / 0${
      i + 1
    }</text><text x="72" y="320" fill="#1F3329" font-family="sans-serif" font-size="62" font-weight="700">${title}</text>${copy
      .split('\n')
      .map(
        (line, j) =>
          `<text x="72" y="${
            410 + j * 60
          }" fill="#1F3329" font-family="sans-serif" font-size="42">${line}</text>`
      )
      .join(
        ''
      )}<text x="72" y="870" fill="#FFFEFB" font-family="sans-serif" font-size="30">A little more to share.</text></svg>`
  );
}
for (let i = 0; i < campaigns.length; i++)
  await sharp(path.join(output, `campaign-${i}.svg`))
    .png()
    .toFile(path.join(output, `campaign-${i}.png`));
const channels = ['instagram', 'linkedin', 'pinterest', 'facebook', 'threads'];
const integrations = channels.map((providerIdentifier, i) => ({
  id: `channel-${i}`,
  name: 'Studio Notes',
  providerIdentifier,
  identifier: providerIdentifier,
  picture: `${origin}/img/product/campaign-${i}.png`,
  disabled: false,
  inBetweenSteps: false,
  refreshNeeded: false,
  customerId: null,
}));
const texts = [
  'A little inspiration for the weekend. Save this for your next slow morning.',
  'Good work starts with a fresh perspective. What are you making this week?',
  'A new chapter, a fresh start. Here’s what we’ve been working on.',
  'Meet the people behind the work. A peek inside our studio.',
  'Make room for something special. Our next collection is almost here.',
];
const posts = Array.from({ length: 10 }, (_, i) => ({
  id: `post-${i}`,
  group: `group-${i}`,
  content: texts[i % 5],
  publishDate: `2026-11-0${2 + (i % 7)}T${String(
    9 + Math.floor(i / 7) * 2
  ).padStart(2, '0')}:00:00.000Z`,
  state: ['QUEUE', 'PUBLISHED', 'DRAFT', 'ERROR', 'QUEUE'][i % 5],
  integration: integrations[i % 5],
  tags: [
    {
      tag: {
        id: 'tag',
        name: ['Weekend edit', 'New collection', 'Studio notes'][i % 3],
        color: ['#FFCE3A', '#FF9CCB', '#6EE0A6'][i % 3],
      },
    },
  ],
  image: [],
  intervalInDays: null,
  releaseURL: i % 5 === 1 ? 'https://example.com/demo' : null,
}));
const user = {
  id: 'demo',
  orgId: 'demo',
  email: 'studio@example.com',
  name: 'Studio team',
  role: 'SUPERADMIN',
  tier: 'PRO',
  publicApi: 'demo-placeholder-not-a-key',
  timezoneName: 'UTC',
  isLifetime: false,
};
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
    timezoneId: 'UTC',
    colorScheme: 'light',
    locale: 'en-US',
  });
  await context.addCookies([
    {
      name: 'auth',
      value: 'homepage-demo-fixture',
      domain: new URL(origin).hostname,
      path: '/',
    },
  ]);
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date('2026-11-02T07:00:00Z'));
  page.on('pageerror', (e) => console.error('App:', e.message));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace(/^\/api/, '');
    let data = [];
    if (p === '/user/self') data = user;
    else if (p === '/user/organizations')
      data = [{ id: 'demo', name: 'Studio team' }];
    else if (p === '/integrations/list') data = { integrations };
    else if (p === '/posts') data = { posts };
    else if (p === '/posts/first-run')
      data = { hasPosts: true, hasIntegrations: true };
    else if (p === '/notifications') data = { notifications: [], count: 0 };
    else if (p === '/media')
      data = {
        pages: 1,
        results: campaigns.map((_, i) => ({
          id: `media-${i}`,
          name: `studio-notes-${i}.png`,
          path: `${origin}/img/product/campaign-${i}.png`,
          createdAt: '2026-11-01T12:00:00Z',
        })),
      };
    else if (p === '/user/personal')
      data = {
        ...user,
        picture: null,
        bio: 'A small studio with plenty to share.',
      };
    else if (p === '/settings/shortlink') data = { enabled: false };
    else if (p === '/user/profile') data = { ...user, timezone: 'UTC' };
    else if (p === '/settings/team')
      data = {
        users: [
          {
            id: 'member-1',
            role: 'SUPERADMIN',
            user: { id: 'demo', email: 'studio@example.com' },
          },
          {
            id: 'member-2',
            role: 'USER',
            user: { id: 'writer', email: 'writer@example.com' },
          },
        ],
      };
    else if (p.startsWith('/analytics/'))
      data = ['Impressions', 'Engagement', 'Followers'].map((label, j) => ({
        label,
        percentage: 14 + j * 3,
        data: Array.from({ length: 30 }, (_, i) => ({
          date: `2026-10-${String(i + 1).padStart(2, '0')}`,
          total: Math.round((i + 4) * (j + 1) * 12 + Math.sin(i) * 26),
        })),
      }));
    await route.fulfill({ json: data });
  });
  async function visit(route) {
    await page.goto(origin + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
  }
  async function capture(name, locator) {
    if ((await page.locator('body').innerText()).includes('Application error'))
      throw new Error('App failed while capturing ' + name);
    const png = locator ? await locator.screenshot() : await page.screenshot();
    await writeFile(path.join(output, name + '.png'), png);
    for (const width of [720, 1440, 2880]) {
      const meta = await sharp(png).metadata();
      if (width <= meta.width)
        await sharp(png)
          .resize({ width })
          .webp({ quality: 92, effort: 6 })
          .toFile(path.join(output, `${name}-${width}.webp`));
    }
    const crops = {
      calendar: { left: 440, top: 176, width: 1100, height: 1500 },
      editor: { left: 1640, top: 170, width: 1120, height: 1500 },
      media: { left: 440, top: 160, width: 1200, height: 650 },
      analytics: { left: 1000, top: 180, width: 1800, height: 700 },
      'ai-tools': { left: 990, top: 190, width: 1490, height: 1660 },
      team: { left: 990, top: 190, width: 1790, height: 600 },
    };
    if (crops[name])
      await sharp(png)
        .extract(crops[name])
        .resize({ width: 1080 })
        .webp({ quality: 94, effort: 6 })
        .toFile(path.join(output, name + '-mobile.webp'));
    console.log('Captured', name);
  }
  await visit('/launches?startDate=2026-11-02&endDate=2026-11-08');
  // Scroll the actual calendar to the populated morning hours.
  await page.evaluate(() => {
    const candidates = [...document.querySelectorAll('*')].filter(
      (e) =>
        e.scrollHeight > e.clientHeight + 150 &&
        /auto|scroll/.test(getComputedStyle(e).overflowY)
    );
    for (const e of candidates) {
      const t = [...e.querySelectorAll('*')].find(
        (x) => x.children.length === 0 && x.textContent.trim() === '8:00 AM'
      );
      if (t)
        e.scrollTop +=
          t.getBoundingClientRect().top - e.getBoundingClientRect().top - 40;
    }
  });
  const hide = page.getByText('Hide', { exact: true });
  if (await hide.count()) await hide.click();
  await page.waitForTimeout(300);
  await capture('calendar');
  await page.getByText('Create Post', { exact: true }).first().click();
  await page.waitForTimeout(1600);
  const editor = page.locator('[contenteditable=true]').first();
  if (await editor.count()) await editor.fill(texts[0]);
  await page.locator('.innerComponent .cursor-pointer').first().click();
  await page.waitForTimeout(400);
  await editor.blur();
  await page.getByText('Insert Media', { exact: true }).click();
  await page.waitForTimeout(600);

  await page
    .locator('img[alt="media"][src*="campaign-0.png"]')
    .first()
    .click({ position: { x: 16, y: 16 } });

  const add = page
    .getByRole('button', {
      name: /Add selected.*|Insert selected|Insert media|Add media|Select.*file/i,
    })
    .last();
  if (await add.count()) await add.click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(800);
  await capture('editor');
  await page.setViewportSize({ width: 1440, height: 720 });
  await visit('/media');
  await capture('media');
  await visit('/analytics');
  await capture('analytics');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit('/settings?tab=ai_tools');
  // Use the public endpoint as sample content; retain the app's own markup.
  await page.locator('pre').evaluateAll((nodes) => {
    for (const node of nodes)
      node.textContent = node.textContent.replaceAll(
        'http://localhost:8088',
        'https://app.castrapid.com'
      );
  });
  await capture('ai-tools');
  await page.setViewportSize({ width: 1440, height: 650 });
  await visit('/settings?tab=teams');
  await capture('team');
  await context.close();
} finally {
  await browser.close();
}
