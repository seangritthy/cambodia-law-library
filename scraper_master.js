const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const BASE_URL_BAKC = 'https://www.bakc.org.kh';
const DEST_DIR = path.join(__dirname, 'src', 'pdfs');
const LIBRARY_FILE = path.join(__dirname, 'src', 'library.json');

// Target category URLs to crawl across sources
const CATEGORY_SOURCES = [
    { source: 'BAKC - Codes & Constitution', url: '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-40-43/2020-03-08-07-27-42' },
    { source: 'BAKC - General Legislation', url: '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-40-16' },
    { source: 'BAKC - Administrative Laws', url: '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-32-35/2020-02-15-17-51-21' },
    { source: 'BAKC - Education & Culture Laws', url: '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-32-56/2020-03-08-07-01-17' },
    { source: 'BAKC - Finance & Economic Laws', url: '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-33-16/2020-03-08-07-04-06' },
    { source: 'BAKC - Land & Property Laws', url: '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-33-47/2020-03-08-07-05-39' },
    { source: 'BAKC - Labor & Social Security Laws', url: '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-34-10/2020-03-08-07-07-31' },
    { source: 'BAKC - Justice & Court Decisions', url: '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-35-23/2020-03-08-07-14-03' }
];

// Ensure destination PDF directory exists
if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

// Load existing library if available to avoid duplicate downloads
let library = [];
if (fs.existsSync(LIBRARY_FILE)) {
    try {
        library = JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf8'));
    } catch(e) {
        console.error('Error reading library.json:', e.message);
    }
}

// Clean and categorize titles automatically
function sanitizeTitle(text) {
    let clean = text
        .replace(/[\n\r\t]/g, ' ')
        .replace(/ទាញយក|ទាញយកឯកសារ|PDF|Download|Click here/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (clean.length < 3) return null;
    return clean.substring(0, 120);
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

// Download PDF file with stream safety check
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(filepath);
        const protocol = url.startsWith('https') ? https : http;

        const request = protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    fileStream.close();
                    fs.unlinkSync(filepath);
                    return downloadFile(redirectUrl.startsWith('http') ? redirectUrl : BASE_URL_BAKC + redirectUrl, filepath)
                        .then(resolve)
                        .catch(reject);
                }
            }

            if (response.statusCode !== 200) {
                fileStream.close();
                if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                return reject(new Error(`HTTP ${response.statusCode}`));
            }

            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                const stats = fs.statSync(filepath);
                if (stats.size < 1000) {
                    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                    reject(new Error('Corrupted or empty file (< 1KB)'));
                } else {
                    resolve(stats.size);
                }
            });
        });

        request.on('error', (err) => {
            fileStream.close();
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            reject(err);
        });

        request.on('timeout', () => {
            request.destroy();
            fileStream.close();
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            reject(new Error('Request Timeout'));
        });
    });
}

// Save JSON helper
function saveLibraryJSON() {
    fs.writeFileSync(LIBRARY_FILE, JSON.stringify(library, null, 2), 'utf8');
}

// Main Scraping Process
async function runScraper() {
    console.log('====================================================');
    console.log('🇰🇭 CAMBODIA LAW LIBRARY - MASTER DATA SCRAPER 🇰🇭');
    console.log('====================================================');
    console.log(`Initial books count in library.json: ${library.length}`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const sourceItem of CATEGORY_SOURCES) {
        console.log(`\n🔍 Crawling: [${sourceItem.source}]...`);
        const fullCatUrl = sourceItem.url.startsWith('http') ? sourceItem.url : BASE_URL_BAKC + sourceItem.url;

        try {
            const res = await axios.get(fullCatUrl, {
                timeout: 12000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const $ = cheerio.load(res.data);
            const anchorElements = $('a').toArray();

            for (const el of anchorElements) {
                const href = $(el).attr('href');
                let rawText = $(el).text().trim() || $(el).parent().text().trim();

                if (href && (href.toLowerCase().includes('.pdf') || href.toLowerCase().includes('/pdf/'))) {
                    let pdfUrl = href.startsWith('http') ? href : BASE_URL_BAKC + href;
                    
                    // Clean URL
                    const pdfEnd = pdfUrl.toLowerCase().indexOf('.pdf');
                    if (pdfEnd !== -1) {
                        pdfUrl = pdfUrl.substring(0, pdfEnd + 4);
                    }

                    const cleanTitle = sanitizeTitle(rawText) || `ឯកសារច្បាប់ ${library.length + 1}`;

                    // Check duplicate URL
                    const exists = library.find(item => item.url === pdfUrl || (item.title === cleanTitle && item.filename));
                    if (exists) {
                        skippedCount++;
                        continue;
                    }

                    const nextId = library.length > 0 ? Math.max(...library.map(l => l.id || 0)) + 1 : 1;
                    const filename = `law_book_${nextId}.pdf`;
                    const filepath = path.join(DEST_DIR, filename);

                    const { category, color } = detectCategoryAndColor(cleanTitle);

                    console.log(`  📥 Downloading [${category.toUpperCase()}]: "${cleanTitle.substring(0, 50)}..."`);

                    try {
                        const bytes = await downloadFile(pdfUrl, filepath);
                        const newBook = {
                            id: nextId,
                            title: cleanTitle,
                            filename: filename,
                            category: category,
                            color: color,
                            url: pdfUrl,
                            fileSizeKB: Math.round(bytes / 1024),
                            addedDate: new Date().toISOString().split('T')[0]
                        };

                        library.push(newBook);
                        addedCount++;
                        saveLibraryJSON();
                        console.log(`     ✅ Saved as ${filename} (${Math.round(bytes/1024)} KB)`);
                    } catch (dlErr) {
                        console.log(`     ⚠️ Failed download: ${dlErr.message}`);
                    }
                }
            }

        } catch(catErr) {
            console.error(`❌ Failed crawling source [${sourceItem.source}]: ${catErr.message}`);
        }
    }

    // Final Summary Report
    console.log('\n====================================================');
    console.log('🎉 SCRAPING & CATALOG ENRICHMENT COMPLETE!');
    console.log('====================================================');
    console.log(` Total Library Documents: ${library.length}`);
    console.log(` New Documents Added:     ${addedCount}`);
    console.log(` Existing Skipped:        ${skippedCount}`);

    // Category distribution
    const counts = {};
    library.forEach(b => {
        const cat = b.category || 'law';
        counts[cat] = (counts[cat] || 0) + 1;
    });
    console.log('\n📊 Category Distribution:');
    Object.entries(counts).forEach(([cat, c]) => {
        console.log(`   - ${cat.toUpperCase()}: ${c} documents`);
    });
    console.log('====================================================\n');
}

// Execute
runScraper();
