import { readFile, utils } from 'xlsx';

const workbook = readFile('./datos/Personal.xlsx');
const sheetNameList = workbook.SheetNames;

const data = {};
for (const sheetName of sheetNameList) {
    const sheet = workbook.Sheets[sheetName];
    data[sheetName] = utils.sheet_to_json(sheet, { defval: null });
}

console.log(JSON.stringify(data, null, 2));
