const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const http = require('http');

const BASE_URL = 'https://moj.gov.kh';
const START_URL = 'https://moj.gov.kh/kh/book-library';
const DEST_DIR = path.join(__dirname, 'src', 'pdfs');
const LIBRARY_FILE = path.join(__dirname, 'src', 'library.json');

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,km;q=0.8'
};

if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

let library = [];
if (fs.existsSync(LIBRARY_FILE)) {
    try {
        library = JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf8'));
    } catch(e) {
        console.error('Error reading library.json:', e.message);
    }
}

function sanitizeTitle(text) {
    if (!text) return null;
    let clean = text
        .replace(/[\n\r\t]/g, ' ')
        .replace(/ទាញយក|ទាញយកឯកសារ|PDF|Download|Click here/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (clean.length < 3) return null;
    return clean;
}

function detectCategoryAndColor(title) {
    const t = title.toLowerCase();
    if (t.includes('រដ្ឋធម្មនុញ្ញ') || t.includes('ក្រម')) {
        return { category: 'code', color: 'gold' };
    } else if (t.includes('ព្រះរាជក្រឹត្យ')) {
        return { category: 'royal', color: 'yellow' };
    } else if (t.includes('អនុក្រឹត្យ')) {
        return { category: 'sub', color: 'green' };
    } else if (t.includes('ប្រកាស') || t.includes('សេចក្តីសម្រេច') || t.includes('ដីកា')) {
        return { category: 'decision', color: 'red' };
    } else {
        return { category: 'law', color: 'blue' };
    }
}

async function fetchPage(url) {
    try {
        const response = await axios.get(url, { headers, timeout: 20000 });
        return response.data;
    } catch(e) {
        console.error(`Failed to fetch ${url}:`, e.message);
        return null;
    }
}

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(filepath);
        const protocol = url.startsWith('https') ? https : http;

        const req = protocol.get(url, { headers, timeout: 30000 }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                const redirect = res.headers.location;
                if (redirect) {
                    fileStream.close();
                    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                    const fullUrl = redirect.startsWith('http') ? redirect : BASE_URL + redirect;
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
                if (stats.size < 1000) { // Invalid or tiny file
                    fs.unlinkSync(filepath);
                    return reject(new Error('Downloaded file too small or invalid'));
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
            reject(new Error('Download timeout'));
        });
    });
}

async function scrapeAllMojBooks() {
    console.log('=== Starting MOJ Book Library Scraper ===');
    const visitedPages = new Set();
    const pagesToVisit = [START_URL];
    let pageCount = 0;
    let newBooksCount = 0;

    while (pagesToVisit.length > 0) {
        const currentUrl = pagesToVisit.shift();
        if (visitedPages.has(currentUrl)) continue;
        visitedPages.add(currentUrl);

        pageCount++;
        console.log(`\n[Page ${pageCount}] Crawling: ${currentUrl}`);
        const html = await fetchPage(currentUrl);
        if (!html) continue;

        const $ = cheerio.load(html);

        // Find pagination links
        $('a[href*="book-library"]').each((i, el) => {
            let href = $(el).attr('href');
            if (href) {
                if (!href.startsWith('http')) href = BASE_URL + href;
                if (!visitedPages.has(href) && !pagesToVisit.includes(href)) {
                    pagesToVisit.push(href);
                }
            }
        });

        // Parse book cards / PDF links
        const foundOnPage = [];

        // Check cards or links
        $('a[href*=".pdf"], a[href*="/document/"], a[href*="/Book/"]').each((i, el) => {
            let pdfUrl = $(el).attr('href');
            if (!pdfUrl || !pdfUrl.toLowerCase().includes('.pdf')) return;
            if (!pdfUrl.startsWith('http')) pdfUrl = BASE_URL + pdfUrl;

            let title = $(el).text().trim() || $(el).attr('title') || $(el).attr('aria-label');
            
            // Try parent container for better title
            const container = $(el).closest('.card, .book, .item, .col-md-3, .col-md-4, .col-sm-6, .box, li, div');
            if (container.length > 0) {
                const containerText = container.find('h1, h2, h3, h4, h5, h6, .title, .book-title, strong, p').first().text().trim();
                if (containerText && containerText.length > 5) {
                    title = containerText;
                }
            }

            const cleanTitle = sanitizeTitle(title);
            if (!cleanTitle) return;

            // Check if already in list
            if (!foundOnPage.some(b => b.pdfUrl === pdfUrl)) {
                foundOnPage.push({ title: cleanTitle, pdfUrl });
            }
        });

        console.log(`Found ${foundOnPage.length} PDF books on page ${pageCount}`);

        for (const book of foundOnPage) {
            const existing = library.find(item => item.pdfUrl === book.pdfUrl || item.title === book.title);
            if (existing) {
                console.log(`  - Exists: ${book.title}`);
                continue;
            }

            const id = 'moj_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const safeFilename = `moj_${id}.pdf`;
            const destPath = path.join(DEST_DIR, safeFilename);

            console.log(`  + Downloading: ${book.title}...`);
            try {
                await downloadFile(book.pdfUrl, destPath);
                const { category, color } = detectCategoryAndColor(book.title);

                const newBookEntry = {
                    id,
                    title: book.title,
                    filename: safeFilename,
                    category,
                    color,
                    pdfUrl: book.pdfUrl,
                    source: 'Ministry of Justice (moj.gov.kh)',
                    addedAt: new Date().toISOString()
                };

                library.push(newBookEntry);
                newBooksCount++;
                console.log(`    Saved successfully as ${safeFilename}`);
            } catch(err) {
                console.error(`    Download failed: ${err.message}`);
            }
        }

        // Save library.json periodically
        fs.writeFileSync(LIBRARY_FILE, JSON.stringify(library, null, 2));
    }

    console.log(`\n=== Scraping Completed! Added ${newBooksCount} new books. Total library count: ${library.length} ===`);
}

scrapeAllMojBooks();
