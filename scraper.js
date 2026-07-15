const fs = require('fs');
const https = require('https');
const path = require('path');

const pdfs = [
    {
        name: "Criminal Code & Amendments (2018)",
        url: "https://www.bakc.org.kh/pdf/2018-02%20%E1%9E%80%E1%9F%92%E1%9E%9A%E1%9E%98%E1%9E%96%E1%9F%92%E1%9E%9A%E1%9E%A0%E1%9F%92%E1%9E%98%E1%9E%91%E1%9E%8E%E1%9F%92%E1%9E%8C%20%E1%9E%93%E1%9E%B7%E1%9E%84%20%E1%9E%9C%E1%9E%B7%E1%9E%9F%E1%9F%84%E1%9E%92%E1%9E%93%E1%9E%80%E1%9E%98%E1%9F%92%E1%9E%98%E1%9E%80%E1%9F%92%E1%9E%9A%E1%9E%98%E1%9E%96%E1%9F%92%E1%9E%9A%E1%9E%A0%E1%9F%92%E1%9E%98%E1%9E%91%E1%9E%8E%E1%9F%92%E1%9E%8C%20%E1%9E%93%E1%9F%83%E1%9E%96%E1%9F%92%E1%9E%9A%E1%9F%87%E1%9E%9A%E1%9E%B6%E1%9E%87%E1%9E%B6%E1%9E%8E%E1%9E%B6%E1%9E%85%E1%9E%80%E1%9F%92%E1%9E%9A%E1%9E%80%E1%9E%98%E1%9F%92%E1%9E%96%E1%9E%BB%E1%9E%87%E1%9E%B6.pdf",
        filename: "criminal_code.pdf"
    }
];

const destDir = path.join(__dirname, 'src', 'pdfs');

if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
}

pdfs.forEach(pdf => {
    const file = fs.createWriteStream(path.join(destDir, pdf.filename));
    https.get(pdf.url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close();  
            console.log(`Downloaded: ${pdf.name}`);
        });
    }).on('error', function(err) {
        fs.unlink(path.join(destDir, pdf.filename)); 
        console.error(`Error downloading ${pdf.name}: ${err.message}`);
    });
});
