const puppeteer = require('puppeteer');

(async () => {
    let hasError = false;
    console.log("Launching browser...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error(`PAGE LOG ERROR: ${msg.text()}`);
            hasError = true;
        } else {
            console.log(`PAGE LOG: ${msg.text()}`);
        }
    });

    page.on('pageerror', err => {
        console.error(`PAGE EXCEPTION: ${err.toString()}`);
        hasError = true;
    });

    console.log("Navigating to http://localhost:3000 ...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    console.log("Waiting for library to load...");
    await page.waitForSelector('.book-card');

    console.log("Clicking the first book (Criminal Code)...");
    const cards = await page.$$('.book-card');
    await cards[0].click();

    console.log("Waiting for book to render...");
    await new Promise(r => setTimeout(r, 3000));

    console.log("Clicking Back...");
    await page.click('#back-btn');
    await new Promise(r => setTimeout(r, 1000));

    console.log("Clicking the second book (law_book_1)...");
    await cards[1].click();
    await new Promise(r => setTimeout(r, 3000));

    console.log("Testing Read Text feature...");
    await page.click('#read-btn');
    await new Promise(r => setTimeout(r, 3000));

    await browser.close();

    if (hasError) {
        console.log("TEST FAILED: Errors detected!");
        process.exit(1);
    } else {
        console.log("TEST PASSED: No errors detected!");
        process.exit(0);
    }
})();
