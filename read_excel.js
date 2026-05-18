const xlsx = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, 'Backend', 'Bengaluru_Ward_Responsibility_Map.xlsx');
const workbook = xlsx.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

const shivajinagar = data.filter(row => 
  (row['Ward Name'] && row['Ward Name'].toLowerCase().includes('shivaji')) || 
  (row['Assembly Constituency (AC)'] && row['Assembly Constituency (AC)'].toLowerCase().includes('shivaji'))
);

console.log("Found matches:");
console.log(shivajinagar);
