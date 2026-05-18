const xlsx = require('xlsx');
const path = require('path');

let wardDataMap = new Map();

/**
 * Initializes the Excel service by loading Bengaluru_Ward_Responsibility_Map.xlsx into memory.
 */
function initializeExcelService() {
  try {
    const excelPath = path.join(__dirname, '../Bengaluru_Ward_Responsibility_Map.xlsx');
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    data.forEach(row => {
      const wardNo = row['Ward Number'];
      if (wardNo) {
        wardDataMap.set(Number(wardNo), {
          wardName: row['Ward Name'] || 'Unknown Ward',
          adminZone: row['Administrative Zone'] || 'Unknown Zone',
          acName: row['Assembly Constituency (AC)'] || 'Unknown AC',
          mlaName: row['MLA Name'] || 'Unassigned',
          pcName: row['Parliamentary Constituency (PC)'] || 'Unknown PC',
          mpName: row['MP Name'] || 'Unassigned'
        });
      }
    });
    console.log(`Excel Resolver initialized: Loaded ${wardDataMap.size} wards into memory.`);
  } catch (err) {
    console.error('Failed to initialize Excel Resolver:', err.message);
  }
}

/**
 * Lookup function to get ward details from Excel map.
 * @param {number|string} wardNo 
 * @returns {Object|null} Ward details or null if not found
 */
function getWardDetailsFromExcel(wardNo) {
  if (!wardNo) return null;
  return wardDataMap.get(Number(wardNo)) || null;
}

// Auto-initialize on import
initializeExcelService();

module.exports = {
  getWardDetailsFromExcel,
  initializeExcelService
};
