const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');

const baseUrl = 'https://www.bakc.org.kh';
const destDir = path.join(__dirname, 'src', 'pdfs');

const categoryUrls = [
    '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-40-43/2020-03-08-07-27-42',
    '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-40-16',
    '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-32-35/2020-02-15-17-51-21',
    '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-32-56/2020-03-08-07-01-17',
    '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-33-16/2020-03-08-07-04-06',
    '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-33-47/2020-03-08-07-05-39'
];

let library = [
    {
        id: 0,
        title: "Criminal Code & Amendments (2018)",
        filename: "criminal_code.pdf",
        url: ""
    }
];

function saveLibrary() {
    fs.writeFileSync(path.join(__dirname, 'src', 'library.json'), JSON.stringify(library, null, 2));
}

async function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(path.join(destDir, filename));
        https.get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                file.close();
                // Check size
                const stats = fs.statSync(path.join(destDir, filename));
                if (stats.size < 1000) {
                    fs.unlinkSync(path.join(destDir, filename));
                    reject(new Error("File too small, likely 404"));
                } else {
                    resolve();
                }
            });
        }).on('error', function(err) {
            fs.unlink(path.join(destDir, filename)); 
            reject(err);
        });
    });
}

async function scrape() {
    // delete old bad files
    const files = fs.readdirSync(destDir);
    for (const f of files) {
        if (f.startsWith('law_')) fs.unlinkSync(path.join(destDir, f));
    }

    console.log("Starting reliable scraper...");
    for (const cat of categoryUrls) {
        try {
            const res = await axios.get(baseUrl + cat, { timeout: 10000 });
            const $ = cheerio.load(res.data);
            
            const links = $('a').toArray();
            for (const link of links) {
                const href = $(link).attr('href');
                let text = $(link).text().trim();
                
                if (!text) {
                    text = $(link).parent().text().trim(); 
                }
                
                if (href && (href.includes('.pdf') || href.includes('/pdf/'))) {
                    let fullUrl = href.startsWith('http') ? href : baseUrl + href;
                    let filename = `law_${library.length}.pdf`;
                    
                    if (text.length < 3) text = `Law Document ${library.length}`;
                    
                    if (!library.find(l => l.url === fullUrl)) {
                        console.log(`Downloading: ${text}`);
                        try {
                            await downloadFile(fullUrl, filename);
                            library.push({
                                id: library.length,
                                title: text.replace(/\n/g, ' ').substring(0, 100),
                                filename: filename,
                                url: fullUrl
                            });
                            saveLibrary();
                        } catch(e) {
                            console.log(`Skipped ${filename} due to error: ${e.message}`);
                        }
                    }
                }
            }
        } catch(e) {
            console.error(`Failed to scrape ${cat}`, e.message);
        }
    }
    
    console.log(`Scraping complete! Downloaded ${library.length} laws.`);
}

scrape();
