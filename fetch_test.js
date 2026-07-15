const puppeteer = require('puppeteer');

async function run() {
    console.log("Launching browser...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set a normal user agent
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36");
    
    const targetUrl = 'https://www.bakc.org.kh/index.php/en/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-38-59/2020-03-08-07-27-42';
    console.log(`Navigating to ${targetUrl}`);
    
    try {
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        const content = await page.content();
        console.log("Success! Page length:", content.length);
        
        // Find PDFs on this page
        const pdfLinks = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .filter(a => a.href.includes('.pdf') || a.href.includes('/pdf/'))
                .map(a => ({ text: a.innerText.trim(), href: a.href }));
        });
        
        console.log("Found PDFs:", pdfLinks.length);
        console.log(pdfLinks);
        
    } catch (e) {
        console.error("Error navigating:", e);
    }
    
    await browser.close();
}

run();
