const fs = require('fs');
const https = require('https');
const path = require('path');

const url = "https://unpkg.com/page-flip@2.0.7/dist/js/page-flip.browser.js";
const destDir = path.join(__dirname, 'src', 'js');
const dest = path.join(destDir, 'page-flip.browser.js');

if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
}

const file = fs.createWriteStream(dest);
https.get(url, function(response) {
    // Handle redirects
    if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, function(redirectResponse) {
            redirectResponse.pipe(file);
            file.on('finish', function() {
                file.close();  
                console.log(`Downloaded page-flip`);
            });
        });
    } else {
        response.pipe(file);
        file.on('finish', function() {
            file.close();  
            console.log(`Downloaded page-flip`);
        });
    }
});
