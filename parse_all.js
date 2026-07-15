const fs = require('fs');
const cheerio = require('cheerio');

function extractPDFs(htmlFile, label) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const $ = cheerio.load(html);
    const results = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        if (href.toLowerCase().includes('.pdf')) {
            // Fix double-URL bug
            let cleanUrl = href;
            const pdfIdx = href.toLowerCase().indexOf('.pdf');
            if (pdfIdx !== -1) {
                cleanUrl = href.substring(0, pdfIdx + 4);
                if (!cleanUrl.startsWith('/') && !cleanUrl.startsWith('http')) {
                    cleanUrl = '/' + cleanUrl;
                }
            }
            results.push({ title: text || `Law ${results.length + 1}`, url: cleanUrl });
        }
    });
    console.log(`\n=== ${label}: ${results.length} PDFs ===`);
    results.forEach((r, i) => console.log(`${i+1}. ${r.title}\n   ${r.url}`));
    return results;
}

const all = [];
// Check what HTML files we have
['page_a.html', 'page_b.html'].forEach((f, i) => {
    if (fs.existsSync(f) && fs.statSync(f).size > 1000) {
        all.push(...extractPDFs(f, f));
    } else {
        console.log(`${f} empty or missing`);
    }
});

// Also check the scraped content.md files
const dirs = [
    'C:\\Users\\seang\\.gemini\\antigravity\\brain\\79f4c6b2-9f37-4325-be76-1ddeb8f3cf68\\.system_generated\\steps\\807\\content.md',
    'C:\\Users\\seang\\.gemini\\antigravity\\brain\\79f4c6b2-9f37-4325-be76-1ddeb8f3cf68\\.system_generated\\steps\\808\\content.md'
];
dirs.forEach((f, i) => {
    if (fs.existsSync(f)) {
        const md = fs.readFileSync(f, 'utf8');
        const pdfMatches = [...md.matchAll(/https?:\/\/[^\s\)]+\.pdf/gi)];
        const relMatches = [...md.matchAll(/\/[^\s\)]+\.pdf/gi)];
        console.log(`\n=== MD file ${i+1}: ${pdfMatches.length} absolute, ${relMatches.length} relative PDF links ===`);
        pdfMatches.forEach(m => console.log('ABS:', m[0]));
        relMatches.slice(0, 20).forEach(m => console.log('REL:', m[0]));
    }
});

fs.writeFileSync('all_pdfs.json', JSON.stringify(all, null, 2));
console.log(`\nTotal: ${all.length} PDFs found`);
