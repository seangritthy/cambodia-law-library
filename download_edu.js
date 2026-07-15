const fs = require('fs');
const https = require('https');
const path = require('path');

const baseUrl = 'https://www.bakc.org.kh';
const outDir = 'src/pdfs';

const books = [
  { file: 'edu_1.pdf', title: '2007-07 ប្រាក់បំណាច់ស្រាវជ្រាវរបស់សមាជិកបណ្ឌិតសភា ព្រះរាជក្រឹត្យ​លេខ៣១០', url: '/pdf/2007/ព្រះរាជ្យក្រឹត្យ%20២០០៧/11.%20អប់រំ%20និងវប្បធម៌/2007-07%20%20ប្រាក់បំណាច់ស្រាវជ្រាវរបស់សមាជិកបណ្ឌិតសភា%20%20ព្រះរាជក្រឹត្យ​លេខ៣១០.pdf' },
  { file: 'edu_2.pdf', title: '2006-06 អភិវឌ្ឍរមណីយដ្ឋានវប្បធម៌ធម្មជាតិនៃប្រាសាទព្រះវិហារ ព្រះរាជក្រឹត្យលេខ ០៦០៦', url: '/images/post/ច្បាប់២០០៦/ការបែងចែកព្រះរាជក្រឹត្យទៅតាមវិស័យ២០០៦/11.%20អប់រំ%20និងវប្បធម៌/2006-06%20អភិវឌ្ឍរមណីយដ្ឋានវប្បធម៌ធម្មជាតិនៃប្រាសាទព្រះវិហារ%20ព្រះរាជក្រឹត្យលេខ%20០៦០៦.pdf' },
  { file: 'edu_3.pdf', title: '2005-01 ស្ដីពីលក្ខន្តិកៈនៃគ្រឹស្ថានសាធារណៈរដ្ឋបាល ព្រះរាជក្រឹត្យលេខ ០១០៥', url: '/images/post/រាជកិច្ចកាត់ហើយ%20២០០៥/ការបែងចែកព្រះរាជក្រឹត្យទៅតាមវិស័យ២០០៥/11.%20អប់រំ%20និងវប្បធម៌/2005-01%20ស្ដីពីលក្ខន្តិកៈនៃគ្រឹស្ថានសាធារណៈរដ្ឋបាល%20ព្រះរាជក្រឹត្យលេខ%20០១០៥​.pdf' },
  { file: 'edu_5.pdf', title: '2004-09 បង្កើតអាជ្ញាធរដើម្បីការពាររមណីយដ្ឋាន ព្រះរាជក្រឹត្យលេខ២៦៧', url: '/images/post/រាជកិច្ចកាត់ហើយ%20២០០៤/ការបែងចែកព្រះរាជក្រឹត្យទៅតាមវិស័យ២០០៤/11.%20អប់រំ%20និងវប្បធម៌/2004-09%20បង្កើតអាជ្ញាធរដើម្បីការពាររមណីយដ្ឋាន%20ព្រះរាជក្រឹត្យលេខ២៦៧.pdf' }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }
    };
    https.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const results = [];
  for (const b of books) {
    const fullUrl = baseUrl + b.url;
    const dest = path.join(outDir, b.file);
    console.log(`Downloading ${b.file}...`);
    try {
      await downloadFile(fullUrl, dest);
      const size = fs.statSync(dest).size;
      console.log(`  OK: ${(size/1024).toFixed(1)} KB`);
      results.push({ success: true, file: b.file, title: b.title });
    } catch (e) {
      console.log(`  FAILED: ${e.message}`);
      results.push({ success: false, file: b.file, title: b.title });
    }
    await sleep(2000);
  }
  console.log('\nResults:', results.filter(r => r.success).length, '/', books.length, 'downloaded');
  fs.writeFileSync('download_results.json', JSON.stringify(results, null, 2));
}

run();
