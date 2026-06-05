const fs = require('fs');

const sharedStringsXML = fs.readFileSync('./datos/Personal_Unzipped/xl/sharedStrings.xml', 'utf8');
const strings = [];
const stringRegex = /<t[^>]*>(.*?)<\/t>/g;
let match;
while ((match = stringRegex.exec(sharedStringsXML)) !== null) {
    strings.push(match[1]);
}

const sheetXML = fs.readFileSync('./datos/Personal_Unzipped/xl/worksheets/sheet1.xml', 'utf8');
const rowRegex = /<row[^>]*>(.*?)<\/row>/g;
let rowMatch;
const rows = [];
while ((rowMatch = rowRegex.exec(sheetXML)) !== null) {
    const cRegex = /<c r="([A-Z]+)\d+"[^>]*t="([s|inlineStr]*)"[^>]*>(.*?)<\/c>/g;
    let cMatch;
    const rowData = {};
    while ((cMatch = cRegex.exec(rowMatch[1])) !== null) {
        const col = cMatch[1];
        const type = cMatch[2];
        const inner = cMatch[3];
        let val = "";
        if (type === 's') {
            const vMatch = /<v>(.*?)<\/v>/.exec(inner);
            if (vMatch) {
                const idx = parseInt(vMatch[1]);
                val = strings[idx];
            }
        } else {
             const vMatch = /<v>(.*?)<\/v>/.exec(inner);
             if (vMatch) val = vMatch[1];
        }
        rowData[col] = val;
    }
    if (Object.keys(rowData).length > 0) rows.push(rowData);
}
console.log(JSON.stringify(rows, null, 2));
