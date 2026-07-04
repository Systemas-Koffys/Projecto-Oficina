import xlsx from 'xlsx';

const wb = xlsx.readFile('./Muestra de DB de Podar V3.32.xlsx');
console.log('HOJAS:', wb.SheetNames);

wb.SheetNames.forEach(name => {
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
  console.log('\n========================================');
  console.log('HOJA: ' + name + ' (' + (rows.length-1) + ' filas)');
  console.log('========================================');
  if (rows[0]) {
    console.log('\nCOLUMNAS:');
    rows[0].forEach((col, i) => console.log('  [' + i + '] ' + col));
    console.log('\nFILA 1 de ejemplo:');
    if (rows[1]) rows[0].forEach((col, i) => { if (rows[1][i] !== undefined) console.log('  ' + col + ': ' + rows[1][i]); });
    console.log('\nFILA 2 de ejemplo:');
    if (rows[2]) rows[0].forEach((col, i) => { if (rows[2][i] !== undefined) console.log('  ' + col + ': ' + rows[2][i]); });
  }
});
