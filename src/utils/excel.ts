import ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import { generateBenzeneEmailTemplate } from './html.js';
import { Transaction } from '../types/Transaction.js';
import { logger } from './logger.js';
import { db } from '../config/database.js';


export async function convertJsonToExcel(jsonData: Transaction[]) {
  jsonData = jsonData.filter(record => record[ 'materialName' ]?.includes('BENZENE'));
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Transactions');

  // Add the first merged cell with the current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  worksheet.columns = Object.keys(jsonData[ 0 ]).map((key) => ({ header: key, key }));
  worksheet.addRows(jsonData);


  // Create the aggregated data worksheet
  const aggregatedData = await getAggregatedData(jsonData);
  const aggregatedWorksheet = workbook.addWorksheet('Aggregated');
  aggregatedWorksheet.mergeCells('A1:C1');
  aggregatedWorksheet.mergeCells('A2:C2');

  aggregatedWorksheet.getCell('A1').value = `${currentMonth}'s ${currentYear}`;
  aggregatedWorksheet.getCell('A1').alignment = { horizontal: 'center' };
  aggregatedWorksheet.getCell('A2').alignment = { horizontal: 'center' };
  // Add the "Benzene" header
  aggregatedWorksheet.getCell('A2').value = 'Benzene';

  // Add the "Name", "DAILY", and "MTD" headers
  aggregatedWorksheet.getCell('A3').value = 'Name';
  aggregatedWorksheet.getCell('B3').value = 'DAILY';
  aggregatedWorksheet.getCell('C3').value = 'MTD';
  aggregatedData.forEach((row, index) => {
    aggregatedWorksheet.getCell(`A${index + 4}`).value = row.Name;
    aggregatedWorksheet.getCell(`B${index + 4}`).value = row.DAILY;
    aggregatedWorksheet.getCell(`C${index + 4}`).value = row.MTD;
  });

  aggregatedWorksheet.getRow(aggregatedData.length + 3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'D9D8D8' },
  };
  aggregatedWorksheet.getRow(aggregatedData.length + 3).font = {
    bold: true,
  }

  workbook.creator = 'IOCL';
  workbook.getImage(1);
  return { buffer: Buffer.from(await workbook.xlsx.writeBuffer()), html: generateBenzeneEmailTemplate({ month: `${currentMonth} ${currentYear}`, rows: aggregatedData }) };
}

interface RowPos {
  row: number;
  col: number;
}



async function getAggregatedData(records: Transaction[]): Promise<{ Name: string; DAILY: number; MTD: number }[]> {
  const aggregatedData: { [ key: string ]: { DAILY: number; MTD: number } } = {};
  const todayRecords = records.filter(record => record.transactionDate === DateTime.now().toFormat('dd.MM.yyyy'));
  
  const mtdResults = (await db.execute({
    sql: `
        SELECT company_name,SUM(bill_qty) as mtd FROM transactions
        WHERE transaction_date BETWEEN ? AND ?
        AND material_name LIKE '%BENZENE%'
        GROUP BY company_name
        `,
    args: [ DateTime.now().startOf('month').toFormat('dd.MM.yyyy'), DateTime.now().toFormat('dd.MM.yyyy') ],
  }));

  

  for (const record of todayRecords) {
    const { companyName: name, billQty: qty, billAmt: amount } = record;
    const key = name || 'Unknown';

    if (!aggregatedData[ key ]) {
      aggregatedData[ key ] = { DAILY: 0, MTD: mtdResults.rows.find((result) => result.company_name === key)?.mtd as number || 0 };
      if (DateTime.now().month === 12 && DateTime.now().year === 2024) {
        if (key === 'KUTCH') {
          aggregatedData[ key ].MTD += 452.150;
        }
        if(key === 'CHEMIE') {
          aggregatedData[ key ].MTD += 119.992;
        }
      }
    }
    

    aggregatedData[ key ].DAILY += qty;
  }
  aggregatedData[ 'Total' ] = { DAILY: 0, MTD: 0 };
  for (const key in aggregatedData) {
    
    if (key === 'Total') continue;
    aggregatedData[ 'Total' ].DAILY += aggregatedData[ key ].DAILY;
    aggregatedData[ 'Total' ].MTD += aggregatedData[ key ].MTD;
  }
  return Object.entries(aggregatedData).map(([ name, data ]) => ({
    Name: name,
    DAILY: data.DAILY,
    MTD: data.MTD,
  }));
}

