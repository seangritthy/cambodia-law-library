const fs = require('fs');
const https = require('https');
const path = require('path');

const outDir = 'src/pdfs';

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
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function retryFile(filenamePattern, jsonPath) {
    if (!fs.existsSync(jsonPath)) return [];
    const allPdfs = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    let okList = [];
    if (fs.existsSync(jsonPath.replace('.json', '_ok.json'))) {
        okList = JSON.parse(fs.readFileSync(jsonPath.replace('.json', '_ok.json'), 'utf8'));
    }
    
    const toRetry = allPdfs.filter(p => !okList.find(o => o.file === p.file));
    const newOk = [];
    for (const b of toRetry) {
        const dest = path.join(outDir, b.file);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
            newOk.push(b);
            continue;
        }
        console.log(`Retrying ${b.file}...`);
        try {
            await downloadFile(b.url, dest);
            const size = fs.statSync(dest).size;
            console.log(`  OK: ${(size/1024).toFixed(0)} KB`);
            newOk.push(b);
            await sleep(3000);
        } catch(e) {
            console.log(`  FAIL: ${e.message}`);
        }
    }
    return newOk;
}

async function run() {
    let newlyOk = [];
    newlyOk = newlyOk.concat(await retryFile('law_f', 'page_f_pdfs.json'));
    newlyOk = newlyOk.concat(await retryFile('law_gh', 'page_gh_pdfs.json'));
    
    if (newlyOk.length > 0) {
        const libraryPath = 'src/library.json';
        let library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
        let maxId = Math.max(...library.map(x => x.id));
        for (const b of newlyOk) {
            if (!library.find(x => x.filename === b.file)) {
                maxId++;
                library.push({ id: maxId, title: b.title, filename: b.file });
                console.log(`Added: ${b.file} (${b.title})`);
            }
        }
        fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2));
        console.log(`Updated library.json, total books now: ${library.length}`);
    } else {
        console.log("No new books recovered.");
    }
}

run();
