import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateLogo() {
  // Ensure the public/brand directory exists
  const outputDir = path.join(__dirname, '..', 'public', 'brand');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'logo-high-res.png');

  console.log('Launching headless browser...');
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    deviceScaleFactor: 4, // 4x retina scale
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // Assuming Vite dev server defaults to standard 8080 (from your AGENTS.md notes)
  const port = process.env.PORT || 8080;

  const variations = [
    { filename: 'logo-dark-high-res.png', search: '?theme=dark&showText=true' },
    { filename: 'logo-light-high-res.png', search: '?theme=light&showText=true' },
    { filename: 'icon-dark-high-res.png', search: '?theme=dark&showText=false' },
    { filename: 'icon-light-high-res.png', search: '?theme=light&showText=false' },
  ];

  for (const { filename, search } of variations) {
    const targetUrl = `http://localhost:${port}/logo-isolated${search}`;
    const outputPath = path.join(outputDir, filename);

    console.log(`Navigating to ${targetUrl} ...`);
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle' });
    } catch (error) {
      console.error(
        `Failed to navigate to ${targetUrl}. Is your dev server running on port ${port}?`
      );
      await browser.close();
      process.exit(1);
    }

    console.log(`Waiting for logo to render for ${filename}...`);
    const locator = page.locator('#isolated-logo-container');
    await locator.waitFor({ state: 'visible' });

    // Add a tiny artificial delay to ensure any layout shifts or font loading has completed
    await page.waitForTimeout(500);

    // Hardcode strip any remaining backgrounds defined globally by tailwind/app directly before capture
    await page.evaluate(() => {
      document.body.style.setProperty('background', 'transparent', 'important');
      document.documentElement.style.setProperty('background', 'transparent', 'important');
      const root = document.getElementById('root');
      if (root) root.style.setProperty('background', 'transparent', 'important');
    });

    console.log(`Taking transparent screenshot and saving to: ${outputPath}`);
    await locator.screenshot({
      path: outputPath,
      omitBackground: true, // Transparent png
    });
  }

  console.log('Successfully generated all high-resolution PNG variations!');
  await browser.close();
}

generateLogo().catch((err) => {
  console.error('Error taking screenshot:', err);
  process.exit(1);
});
