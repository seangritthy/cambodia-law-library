const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('moj_library.html', 'utf8');
const $ = cheerio.load(html);

console.log('Page Title:', $('title').text().trim());

const items = [];

// Look for cards, list items, or links containing PDF or book details
$('a').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    if (href) {
        items.push({ text, href });
    }
});

console.log(`Total links found: ${items.length}`);

// Print links containing pdf, book, or detail
const pdfLinks = items.filter(it => it.href.toLowerCase().includes('.pdf') || it.href.includes('book') || it.href.includes('detail') || it.href.includes('library') || it.href.includes('download'));
console.log('PDF/Book related links:', JSON.stringify(pdfLinks.slice(0, 50), null, 2));
