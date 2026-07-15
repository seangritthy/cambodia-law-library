const fs = require('fs');
const https = require('https');
const path = require('path');

const outDir = 'src/pdfs';
const pdfs = JSON.parse(fs.readFileSync('page_e_pdfs.json', 'utf8'));

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const options = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' } };
        const req = https.get(url, options, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
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
    for (let i = 0; i < pdfs.length; i++) {
        const b = pdfs[i];
        const dest = path.join(outDir, b.file);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
            console.log(`SKIP ${b.file}`); ok.push(b); continue;
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
        await sleep(1200);
    }
    console.log(`\nDone: ${ok.length} OK, ${fail.length} failed`);
    fs.writeFileSync('download_e_ok.json', JSON.stringify(ok, null, 2));
}

run();
