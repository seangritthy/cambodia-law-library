const fs = require('fs');
const cheerio = require('cheerio');
const https = require('https');
const path = require('path');

// Parse PDFs from page
const $ = cheerio.load(fs.readFileSync('page_f.html'));
let count = 0;
const pdfs = [];
$('a').each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (href.toLowerCase().includes('.pdf')) {
        const clean = href.split('.pdf')[0] + '.pdf';
        const fullUrl = clean.startsWith('http') ? clean : 'https://www.bakc.org.kh' + (clean.startsWith('/') ? clean : '/' + clean);
        console.log(++count + '. ' + (text || 'untitled'));
        pdfs.push({ title: text || 'Law ' + count, url: fullUrl, file: 'law_f_' + count + '.pdf' });
    }
});
console.log('\nTotal found:', count);
fs.writeFileSync('page_f_pdfs.json', JSON.stringify(pdfs, null, 2));

// Download all
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                file.close(); fs.existsSync(dest) && fs.unlinkSync(dest);
                return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) { file.close(); fs.existsSync(dest) && fs.unlinkSync(dest); return reject(new Error('HTTP ' + res.statusCode)); }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        });
        req.on('error', e => { fs.existsSync(dest) && fs.unlinkSync(dest); reject(e); });
        req.setTimeout(25000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

async function run() {
    const ok = [], fail = [];
    for (let i = 0; i < pdfs.length; i++) {
        const b = pdfs[i];
        const dest = path.join('src/pdfs', b.file);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 500) { console.log(`SKIP ${b.file}`); ok.push(b); continue; }
        process.stdout.write(`[${i+1}/${pdfs.length}] ${b.file}... `);
        try {
            await downloadFile(b.url, dest);
            const kb = Math.round(fs.statSync(dest).size / 1024);
            console.log(`OK ${kb}KB`);
            ok.push(b);
        } catch(e) {
            console.log(`FAIL: ${e.message}`);
            fail.push(b);
        }
        await new Promise(r => setTimeout(r, 1200));
    }
    console.log(`\nResult: ${ok.length} OK, ${fail.length} failed`);
    fs.writeFileSync('download_f_ok.json', JSON.stringify(ok, null, 2));
}
run();
