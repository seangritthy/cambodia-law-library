const https = require('https');
const fs = require('fs');

const url = "https://www.bakc.org.kh/images/post/១៩៩៩/ការបែងចែកព្រះរាជក្រមទៅតាមវិស័យ១៩៩៩/17.%20ភូមិបាល%20អចលនទ្រព្យ/1999-06%20ច្បាប់ការបង្កើតក្រសួងរៀបចំដែនដី%20នគររូបនីយកម្មនិងសំណង់.pdf";

const encodedUrl = encodeURI(url);
console.log("Fetching:", encodedUrl);

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
};

https.get(encodedUrl, options, (res) => {
    console.log("Status Code:", res.statusCode);
    if (res.statusCode === 200) {
        const file = fs.createWriteStream('test_law.pdf');
        res.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log("Downloaded successfully!");
        });
    } else {
        console.log("Failed. Status:", res.statusCode);
    }
}).on('error', (err) => {
    console.error("Error:", err.message);
});
