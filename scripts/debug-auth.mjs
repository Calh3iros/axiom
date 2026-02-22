import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Starting Chrome Debugger...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('request', request => {
    if (request.url().includes('supabase.co')) {
      console.log('➡️ REQ:', request.method(), request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('supabase.co')) {
      console.log('⬅️ RES:', response.status(), response.url());
      const location = response.headers()['location'];
      if(location) console.log('   Redirecting to:', location);
    }
  });

  console.log('Navigating to login page...');
  await page.goto('http://localhost:3000/en/auth/login');
  
  console.log('Clicking Google Login...');
  await page.click('button:has-text("Continue with Google")');

  // wait a bit for redirects
  await page.waitForTimeout(5000);

  // Check the current URL where it landed
  console.log('Final URL:', page.url());

  const error = await page.evaluate(() => {
    return document.body.innerText.includes('ERR_INVALID_REDIRECT');
  });
  console.log('Hit ERR_INVALID_REDIRECT?', error);

  await browser.close();
})();
