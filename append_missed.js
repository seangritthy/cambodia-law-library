const fs = require('fs');

const libraryPath = 'src/library.json';
let library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
let maxId = Math.max(...library.map(x => x.id));

function appendToLibrary(jsonPath) {
    if (fs.existsSync(jsonPath)) {
        const okList = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        for (const b of okList) {
            if (!library.find(x => x.filename === b.file)) {
                maxId++;
                library.push({ id: maxId, title: b.title, filename: b.file });
                console.log(`Added: ${b.file} (${b.title})`);
            }
        }
    }
}

appendToLibrary('download_e_ok.json');
appendToLibrary('download_f_ok.json');

fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2));
console.log(`\nUpdated library.json, total books now: ${library.length}`);
