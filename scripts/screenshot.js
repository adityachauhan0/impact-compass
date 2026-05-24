const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000); // Wait for animations/loading
  await page.screenshot({ path: '/Users/adityachauhan/.gemini/antigravity-ide/brain/3d3502de-ffde-42b5-abef-e4c119b7fbb5/scratch/screenshot.png', fullPage: true });
  await browser.close();
  console.log('Screenshot saved');
})();
