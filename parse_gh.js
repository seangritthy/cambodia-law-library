const fs = require('fs');
const path = require('path');

const files = [
    'C:\\Users\\seang\\.gemini\\antigravity\\brain\\79f4c6b2-9f37-4325-be76-1ddeb8f3cf68\\.system_generated\\steps\\919\\content.md',
    'C:\\Users\\seang\\.gemini\\antigravity\\brain\\79f4c6b2-9f37-4325-be76-1ddeb8f3cf68\\.system_generated\\steps\\920\\content.md'
];

let count = 0;
const results = [];

const regex = /\[(.*?)\]\((.*?\.pdf)\)/gi;

files.forEach((file, index) => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        let match;
        while ((match = regex.exec(content)) !== null) {
            let text = match[1].trim();
            let url = match[2];
            let clean = url.split('.pdf')[0] + '.pdf';
            let fullUrl = clean.startsWith('http') ? clean : 'https://www.bakc.org.kh' + (clean.startsWith('/') ? clean : '/' + clean);
            console.log(++count + '. ' + (text || 'untitled'));
            console.log('   ' + fullUrl);
            results.push({ title: text || 'Law ' + count, url: fullUrl, file: `law_gh_${count}.pdf` });
        }
    }
});

console.log('\nTotal:', count);
fs.writeFileSync('page_gh_pdfs.json', JSON.stringify(results, null, 2));
