const fs = require('fs');
const https = require('https');
const path = require('path');
const cheerio = require('cheerio');

const html = fs.readFileSync('page_m_raw.html', 'utf8');
const $ = cheerio.load(html);

let count = 0;
const pdfs = [];

$('a').each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (href.toLowerCase().includes('.pdf')) {
        const clean = href.split('.pdf')[0] + '.pdf';
        const fullUrl = clean.startsWith('http') ? clean : 'https://www.bakc.org.kh' + (clean.startsWith('/') ? clean : '/' + clean);
        count++;
        pdfs.push({ title: text || 'Law ' + count, url: fullUrl, file: `law_m_${count}.pdf` });
    }
});

console.log('Total found:', count);

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const options = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } };
        const req = https.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400) {
                file.close(); fs.existsSync(dest) && fs.unlinkSync(dest);
                return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                file.close(); fs.existsSync(dest) && fs.unlinkSync(dest);
                return reject(new Error('HTTP ' + res.statusCode));
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        });
        req.on('error', (e) => { fs.existsSync(dest) && fs.unlinkSync(dest); reject(e); });
        req.setTimeout(35000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
    if (pdfs.length === 0) return;
    const ok = [], fail = [];
    const outDir = 'src/pdfs';
    for (let i = 0; i < pdfs.length; i++) {
        const b = pdfs[i];
        const dest = path.join(outDir, b.file);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
            console.log(`SKIP ${b.file} (already exists)`);
            ok.push(b);
            continue;
        }
        console.log(`[${i+1}/${pdfs.length}] ${b.file}...`);
        try {
            await downloadFile(b.url, dest);
            const size = fs.statSync(dest).size;
            console.log(`  OK: ${(size/1024).toFixed(0)} KB`);
            ok.push(b);
        } catch(e) {
            console.log(`  FAIL: ${e.message}`);
            fail.push(b);
        }
        await sleep(3000);
    }
    console.log(`\nDone: ${ok.length} OK, ${fail.length} failed`);
    
    // Update library.json automatically
    if (ok.length > 0) {
        const libraryPath = path.join('src', 'library.json');
        let library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
        let maxId = Math.max(...library.map(x => x.id));
        for (const b of ok) {
            if (!library.find(x => x.filename === b.file)) {
                maxId++;
                library.push({ id: maxId, title: b.title, filename: b.file });
            }
        }
        fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2));
        console.log(`Updated library.json, total books: ${library.length}`);
    }
}

run();
