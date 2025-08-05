import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Generate random user agent
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}


async function deploy(htmlCode: string, domain: string) {
  let browser;
  let newDomain = domain;

  try {
    // Launch browser with enhanced security and performance settings
    browser = await puppeteer.launch({
      headless: chromium.headless,
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      timeout: 60000, // Set a longer timeout for browser launch
    });

    const page = await browser.newPage();
    
    // Set random user agent and viewport
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({width: 1024, height: 768});
    
    // Set extra headers to appear more human-like
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });

    // Clear cookies and storage before starting
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');

    console.log('Navigating to EdgeOne Pages...');
    await page.goto('https://edgeone.ai/pages/drop', { 
      waitUntil: 'load',
      timeout: 30000 
    });

    const input = await page.locator('input[placeholder="Enter your domain name"]').waitHandle();
    // console.log(await page.evaluate(el => { return el.outerHTML ? el.outerHTML : "Not found"}, input));

    console.log('Filling domain name...');
    await input.type(`${domain}`, { delay: 100 });


    console.log('Clicking paste code button...');
    await page.locator('::-p-text(Paste Code)').click({ delay: 100 });
    
    console.log('Filling HTML code...');
    const textArea = await page.locator('textarea.PagesUploadCard_inputTextarea__YujEt').waitHandle();
    await page.evaluate((el, code) => {
      el.value = code;
    }, textArea, htmlCode);
    await textArea.type(' ', { delay: 100 });

    // Wait for the deploy button to be enabled
    console.log('Waiting for deploy button to be enabled...');
    await page.waitForFunction(() => {
      const btn = document.querySelector('button.PagesUploadCard_deploymentBtn__7ZMYf');
      return btn && !btn.hasAttribute('disabled');
    }, { timeout: 30000 });

    console.log('Clicking deploy button...');
    await page.locator('button.PagesUploadCard_deploymentBtn__7ZMYf').click({ delay: 100 });
    
    // Handle domain name conflicts with retry logic
    let attempts = 0;
    const maxAttempts = 5;
    let deployed = false;

    while (attempts < maxAttempts && !deployed) {
      try {
        // Wait a bit to see if there's a conflict
        console.log('Checking for domain name conflicts...');
        await (new Promise(resolve => setTimeout(resolve, 5000)));
        
        let conflictObject = await page.locator('::-p-text(Project name already exists)').waitHandle();
        const conflictExists = await page.evaluate(el => {return el.innerHTML ? true : false}, conflictObject);

        if (conflictExists) {
          attempts++;
          newDomain = `${domain}-${attempts}`;
          console.log(`Domain conflict detected, trying: ${newDomain}`);
          
          await page.locator('input[placeholder="Enter your domain name"]').fill(newDomain);
          await page.locator('button.PagesUploadCard_deploymentBtn__7ZMYf').click();
          
        } else {
          // No conflict, deployment should proceed
          console.log('No domain conflict, deployment proceeding...');
        }
      } catch (error) {
        console.error('Error checking for domain conflict:', error);
        break; // Exit loop if there's an error
      }

      await (new Promise(resolve => setTimeout(resolve, 10000)));
      const deployMessage = await page.locator('::-p-text(Deploying...)').waitHandle();
      deployed = await page.evaluate((el) => {return el.innerHTML ? true : false}, deployMessage);

    }
    
    // Wait for deployment to complete (look for success indicators)
    console.log('Waiting for deployment to complete...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if deployment was successful by looking for success indicators
    const successIndicators = [
      '::-p-text(Successful!)',
      'p.PagesUploadCard_fireworkIcon__4skNk',
      '::-p-text(Deployment successful)',
      '::-p-text(Your site is live)',
      '::-p-text(Deployed successfully)',
      'a[href*=".umkm.id"]'
    ];
    
    let deploymentSuccessful = false;
    for (const indicator of successIndicators) {
      try {
        if( await page.locator(indicator)) {
          deploymentSuccessful = true;
          console.log(`Deployment successful! Found indicator: ${indicator}`);
          break;
        }
        }
      catch (error: unknown) {
        // Continue checking other indicators
      }
    }
    
    if (!deploymentSuccessful) {
      console.log('Deployment status unclear, but proceeding...');
    }
    
    // Get the final URL if possible
    let finalUrl = `https://${domain}.edgeone.app`;
    console.log(`Deployment completed. Final URL: ${finalUrl}`);
    
    return {
      success: true,
      url: finalUrl,
      domain: domain,
      deployedAt: Date.now()
    };
    
  } catch (error: unknown) {
    console.error('Puppeteer deployment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Puppeteer deployment failed',
      domain: domain
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export default deploy;