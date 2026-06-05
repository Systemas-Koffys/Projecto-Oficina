const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const dataDir = path.join(__dirname, 'Datos');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

const result = {};

files.forEach(file => {
    try {
        const filePath = path.join(dataDir, file);
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = xlsx.utils.sheet_to_json(worksheet, { defval: null });
        result[file] = json;
    } catch (e) {
        console.error("Error reading file:", file, e);
    }
});

fs.writeFileSync('all_excel_data.json', JSON.stringify(result, null, 2));
console.log("Extracted data saved to all_excel_data.json");
