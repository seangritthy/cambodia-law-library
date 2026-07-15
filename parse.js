const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('scrape.html'));
let count = 0;
$('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && (href.includes('.pdf') || href.includes('/pdf/'))) {
        let text = $(el).text().trim();
        if (!text) text = $(el).parent().text().trim();
        console.log(text, '||', href);
        count++;
    }
});
console.log("Total PDFs found:", count);
