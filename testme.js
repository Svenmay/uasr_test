const puppeteer = require('puppeteer');

(async () => {
    const args = await puppeteer.defaultArgs().filter(flag => flag !== '--enable-automation');
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        ignoreDefaultArgs: true,
        args
    });
    const page = await browser.newPage('');
    const client = await page.target().createCDPSession();
    await client.send('Audits.enable');
    client.on('Audits.issueAdded', (issue) =>{
      if (issue.issue.code === 'NavigatorUserAgentIssue') {
          console.log(issue.issue.details);
      }
    });

    await page.goto('http://www.heise.de');
    await page.waitForTimeout(5000);

    await page.close();
    await browser.close();
})();
