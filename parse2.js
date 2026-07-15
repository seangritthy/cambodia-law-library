const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('scrape2.html'));

const results = [];
$('a').each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (href.toLowerCase().includes('.pdf')) {
        results.push({ title: text || 'Law ' + (results.length + 1), url: href });
    }
});

console.log('Found', results.length, 'PDFs:');
results.forEach((r, i) => console.log(i+1, '|', r.title, '|', r.url));
fs.writeFileSync('pdf_links2.json', JSON.stringify(results, null, 2));
