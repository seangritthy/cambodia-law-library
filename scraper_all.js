const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');

const baseUrl = 'https://www.bakc.org.kh';
const destDir = path.join(__dirname, 'src', 'pdfs');

if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
}

// A selection of the category URLs we found earlier
const categoryUrls = [
    '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-40-43/2020-03-08-07-27-42',
    '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-40-16',
    '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-32-35/2020-02-15-17-51-21',
    '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-32-56/2020-03-08-07-01-17',
    '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-33-16/2020-03-08-07-04-06',
    '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-33-47/2020-03-08-07-05-39',
    '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-34-10/2020-03-08-07-07-31',
    '/index.php/km/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-35-23/2020-03-08-07-14-03'
];

// Include the original criminal code as well
let library = [
    {
        id: 0,
        title: "Criminal Code & Amendments (2018)",
        filename: "criminal_code.pdf"
    }
];

async function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(path.join(destDir, filename));
        https.get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                file.close();  
                resolve();
            });
        }).on('error', function(err) {
            fs.unlink(path.join(destDir, filename)); 
            reject(err);
        });
    });
}

async function scrape() {
    console.log("Starting scraper...");
    for (const cat of categoryUrls) {
        try {
            const res = await axios.get(baseUrl + cat);
            const $ = cheerio.load(res.data);
            
            const links = $('a').toArray();
            for (const link of links) {
                const href = $(link).attr('href');
                let text = $(link).text().trim();
                
                // If the <a> tag itself has no text, look at its parent or previous sibling for context
                if (!text) {
                    text = $(link).parent().text().trim(); 
                }
                
                if (href && (href.includes('.pdf') || href.includes('/pdf/'))) {
                    let fullUrl = href.startsWith('http') ? href : baseUrl + href;
                    let filename = `law_${library.length}.pdf`;
                    
                    if (text.length < 3) {
                        // Clean up text if it's too short or messy
                        text = `Law Document ${library.length}`;
                    }
                    
                    // Avoid downloading duplicates
                    if (!library.find(l => l.url === fullUrl)) {
                        console.log(`Downloading: ${text} -> ${filename}`);
                        await downloadFile(fullUrl, filename);
                        library.push({
                            id: library.length,
                            title: text.replace(/\n/g, ' ').substring(0, 100),
                            filename: filename,
                            url: fullUrl
                        });
                    }
                }
            }
        } catch(e) {
            console.error(`Failed to scrape ${cat}`, e.message);
        }
    }
    
    fs.writeFileSync(path.join(__dirname, 'src', 'library.json'), JSON.stringify(library, null, 2));
    console.log(`Scraping complete! Downloaded ${library.length} laws.`);
}

scrape();
