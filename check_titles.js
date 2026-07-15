const fs = require('fs');
const cheerio = require('cheerio');

const htmlL = fs.readFileSync('page_test.html', 'utf8');
const $1 = cheerio.load(htmlL);
$1('a').each((i, el) => {
    const href = $1(el).attr('href') || '';
    if (href.toLowerCase().includes('.pdf')) {
        let parentText = $1(el).parent().text().trim();
        console.log('Page L link:', href);
        console.log('Link Text:', $1(el).text().trim());
        console.log('Parent Text:', parentText.substring(0, 150));
    }
});

const htmlM = fs.readFileSync('page_m_raw.html', 'utf8');
const $2 = cheerio.load(htmlM);
$2('a').each((i, el) => {
    const href = $2(el).attr('href') || '';
    if (href.toLowerCase().includes('.pdf')) {
        let parentText = $2(el).parent().text().trim();
        console.log('Page M link:', href);
        console.log('Link Text:', $2(el).text().trim());
        console.log('Parent Text:', parentText.substring(0, 150));
    }
});
