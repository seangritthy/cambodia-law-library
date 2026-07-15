const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('page_e.html'));
let count = 0;
const results = [];
$('a').each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (href.toLowerCase().includes('.pdf')) {
        const clean = href.split('.pdf')[0] + '.pdf';
        const fullUrl = clean.startsWith('http') ? clean : 'https://www.bakc.org.kh' + (clean.startsWith('/') ? clean : '/' + clean);
        console.log(++count + '. ' + (text || 'untitled'));
        console.log('   ' + fullUrl);
        results.push({ title: text || 'Law ' + count, url: fullUrl, file: 'law_e_' + count + '.pdf' });
    }
});
console.log('\nTotal:', count);
fs.writeFileSync('page_e_pdfs.json', JSON.stringify(results, null, 2));
