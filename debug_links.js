const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('C:\\Users\\seang\\.gemini\\antigravity\\brain\\79f4c6b2-9f37-4325-be76-1ddeb8f3cf68\\.system_generated\\steps\\938\\content.md', 'utf8');
const $ = cheerio.load(html);
let found = false;
$('a').each((i, el) => {
    const href = $(el).attr('href') || '';
    if(href.includes('pdf') || href.includes('%20')) {
        console.log(href);
        found = true;
    }
});
if(!found) {
    console.log('No links containing pdf found. Showing first 10 links:');
    $('a').slice(0, 10).each((i, el) => console.log($(el).attr('href')));
}
