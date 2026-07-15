const fs = require('fs');
const https = require('https');
const path = require('path');

const content = fs.readFileSync('C:\\Users\\seang\\.gemini\\antigravity\\brain\\79f4c6b2-9f37-4325-be76-1ddeb8f3cf68\\.system_generated\\steps\\938\\content.md', 'utf8');

let count = 0;
const pdfs = [];

const regex = /\[(.*?)\]\((.*?\.pdf)\)/gi;
let match;
while ((match = regex.exec(content)) !== null) {
    let text = match[1].trim();
    let url = match[2];
    let clean = url.split('.pdf')[0] + '.pdf';
    let fullUrl = clean.startsWith('http') ? clean : 'https://www.bakc.org.kh' + (clean.startsWith('/') ? clean : '/' + clean);
    count++;
    pdfs.push({ title: text || 'Law ' + count, url: fullUrl, file: `law_i_${count}.pdf` });
}

console.log('Total found on page I:', count);

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
        req.setTimeout(25000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
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
        await sleep(1500);
    }
    console.log(`\nDone: ${ok.length} OK, ${fail.length} failed`);
    
    // Update library.json automatically
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

run();
