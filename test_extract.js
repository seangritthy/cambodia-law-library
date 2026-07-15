const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const fs = require('fs');

async function testExtract() {
    const data = new Uint8Array(fs.readFileSync('src/pdfs/criminal_code.pdf'));
    const doc = await pdfjsLib.getDocument({
        data: data,
        cMapUrl: 'node_modules/pdfjs-dist/cmaps/',
        cMapPacked: true
    }).promise;
    console.log("Total pages:", doc.numPages);
    
    // Read page 5
    const page = await doc.getPage(5);
    const content = await page.getTextContent();
    const text = content.items.map(i => i.str).join(' ');
    console.log("Extracted Text:", text.substring(0, 500));
}

testExtract().catch(console.error);
