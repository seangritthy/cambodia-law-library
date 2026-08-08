const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DEST_DIR = path.join(__dirname, 'src', 'pdfs');
const LIBRARY_FILE = path.join(__dirname, 'src', 'library.json');

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*'
};

if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

let library = JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf8'));

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(filepath);
        const protocol = url.startsWith('https') ? https : http;

        const req = protocol.get(url, { headers, timeout: 60000 }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                const redirect = res.headers.location;
                if (redirect) {
                    fileStream.close();
                    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                    const fullUrl = redirect.startsWith('http') ? redirect : 'https://moj.gov.kh' + redirect;
                    return downloadFile(fullUrl, filepath).then(resolve).catch(reject);
                }
            }
            if (res.statusCode !== 200) {
                fileStream.close();
                if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                return reject(new Error(`HTTP ${res.statusCode}`));
            }

            res.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                const stats = fs.statSync(filepath);
                if (stats.size < 1000) {
                    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                    return reject(new Error('Downloaded file too small'));
                }
                resolve();
            });
        });

        req.on('error', (err) => {
            fileStream.close();
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            fileStream.close();
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            reject(new Error('Timeout'));
        });
    });
}

async function downloadAllMojPdfs() {
    console.log('=== Downloading all MOJ PDFs for 100% Offline Reading ===');
    const mojBooks = library.filter(item => typeof item.id === 'string' && item.id.startsWith('moj_'));
    console.log(`Found ${mojBooks.length} MOJ books to process.`);

    let successCount = 0;

    for (let i = 0; i < mojBooks.length; i++) {
        const book = mojBooks[i];
        const filename = `${book.id}.pdf`;
        const destPath = path.join(DEST_DIR, filename);

        if (fs.existsSync(destPath) && fs.statSync(destPath).size > 5000) {
            console.log(`[${i+1}/${mojBooks.length}] Already downloaded: ${book.title}`);
            book.filename = filename;
            successCount++;
            continue;
        }

        console.log(`[${i+1}/${mojBooks.length}] Downloading: ${book.title}...`);
        try {
            await downloadFile(book.url, destPath);
            book.filename = filename;
            successCount++;
            console.log(`  Saved to src/pdfs/${filename}`);
        } catch(err) {
            console.error(`  Failed to download: ${err.message}`);
        }

        // Save library.json after each download
        fs.writeFileSync(LIBRARY_FILE, JSON.stringify(library, null, 2));
    }

    console.log(`\n=== Offline PDF Download Completed! ${successCount}/${mojBooks.length} available offline. ===`);
}

downloadAllMojPdfs();
