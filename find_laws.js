const axios = require('axios');
const cheerio = require('cheerio');

async function findLaws() {
    try {
        const response = await axios.get('https://www.bakc.org.kh/index.php/km/');
        const $ = cheerio.load(response.data);
        
        console.log("Looking for PDF links directly:");
        $('a').each((i, link) => {
            const href = $(link).attr('href');
            const text = $(link).text().trim();
            if (href && (href.includes('.pdf') || href.includes('/pdf/'))) {
                console.log(`FOUND PDF: ${text} -> ${href}`);
            }
        });

        console.log("\nLooking for Library or Law menus:");
        $('a').each((i, link) => {
            const href = $(link).attr('href');
            const text = $(link).text().trim();
            if (href && (text.includes('ច្បាប់') || text.includes('បណ្ណាល័យ') || text.includes('ឯកសារ') || href.includes('law') || href.includes('document'))) {
                console.log(`FOUND MENU: ${text} -> ${href}`);
            }
        });

    } catch (e) {
        console.error(e);
    }
}

findLaws();
