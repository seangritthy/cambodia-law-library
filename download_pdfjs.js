const fs = require('fs');
const https = require('https');
const path = require('path');

const files = [
    {
        url: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
        name: "pdf.min.js"
    },
    {
        url: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
        name: "pdf.worker.min.js"
    }
];

const destDir = path.join(__dirname, 'src', 'js');

if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
}

files.forEach(fileObj => {
    const file = fs.createWriteStream(path.join(destDir, fileObj.name));
    https.get(fileObj.url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close();  
            console.log(`Downloaded: ${fileObj.name}`);
        });
    });
});
