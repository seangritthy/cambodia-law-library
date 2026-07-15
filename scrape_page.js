const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');

const targetUrl = "https://www.bakc.org.kh/index.php/en/2020-02-01-15-34-45/2020-02-02-03-24-55/2020-02-02-03-38-59/2020-03-08-07-27-42";
const baseUrl = "https://www.bakc.org.kh";
const destDir = path.join(__dirname, 'src', 'pdfs');

let library = [];

async function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(path.join(destDir, filename));
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, function(response) {
            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(path.join(destDir, filename));
                return reject(new Error("Failed to download, status code: " + response.statusCode));
            }
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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log("Fetching page...");
    const res = await axios.get(targetUrl);
    const $ = cheerio.load(res.data);
    
    const links = $('a').toArray();
    for (const link of links) {
        const href = $(link).attr('href');
        let text = $(link).text().trim();
        if (!text) text = $(link).parent().text().trim();
        
        if (href && (href.includes('.pdf') || href.includes('/pdf/'))) {
            let fullUrl = href.startsWith('http') ? href : baseUrl + href;
            let filename = `law_book_${library.length + 1}.pdf`;
            
            if (text.length < 3) text = `Law Document ${library.length + 1}`;
            
            if (!library.find(l => l.url === fullUrl)) {
                console.log(`Downloading: ${text}`);
                try {
                    await downloadFile(fullUrl, filename);
                    console.log(`Saved as ${filename}`);
                    library.push({
                        id: library.length + 1,
                        title: text.replace(/\n/g, ' ').substring(0, 150),
                        filename: filename,
                        url: "" // Clear URL so it loads from local
                    });
                    await delay(3000); // 3 second delay to avoid ban
                } catch(e) {
                    console.log(`Failed to download ${text}: ${e.message}`);
                }
            }
        }
    }
    
    fs.writeFileSync(path.join(__dirname, 'src', 'library.json'), JSON.stringify(library, null, 2));
    console.log(`Done! Downloaded ${library.length} books.`);
}

run();
