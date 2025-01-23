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
  console.log(aggregatedData.all.length);
  const worksheetMonthAll = workbook.addWorksheet('Monthly Transactions');
  worksheetMonthAll.columns = Object.keys(aggregatedData.all[ 0 ]).map((key) => ({ header: key, key }));
  worksheetMonthAll.addRows(aggregatedData.all);

  aggregatedWorksheet.getCell('A1').value = `${currentMonth}'s ${currentYear}`;
  aggregatedWorksheet.getCell('A1').alignment = { horizontal: 'center' };
  aggregatedWorksheet.getCell('A2').alignment = { horizontal: 'center' };
  // Add the "Benzene" header
  aggregatedWorksheet.getCell('A2').value = 'Benzene';

  // Add the "Name", "DAILY", and "MTD" headers
  aggregatedWorksheet.getCell('A3').value = 'Name';
  aggregatedWorksheet.getCell('B3').value = 'DAILY';
  aggregatedWorksheet.getCell('C3').value = 'MTD';
  aggregatedData.aggregated.forEach((row, index) => {
    aggregatedWorksheet.getCell(`A${index + 4}`).value = row.Name;
    aggregatedWorksheet.getCell(`B${index + 4}`).value = row.DAILY;
    aggregatedWorksheet.getCell(`C${index + 4}`).value = row.MTD;
  });

  aggregatedWorksheet.getRow(aggregatedData.aggregated.length + 3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'D9D8D8' },
  };
  aggregatedWorksheet.getRow(aggregatedData.aggregated.length + 3).font = {
    bold: true,
  }

  workbook.creator = 'IOCL';
  workbook.getImage(1);
  return {
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    html: generateBenzeneEmailTemplate({
      month: `${currentMonth} ${currentYear}`,
      rows: aggregatedData.aggregated
    }),
    aggregatedData:aggregatedData.aggregated
  };
}

interface RowPos {
  row: number;
  col: number;
}



async function getAggregatedData(records: Transaction[]): Promise<{ all: Transaction[]; aggregated: { Name: string; DAILY: number; MTD: number }[] }> {
  const aggregatedData: { [ key: string ]: { DAILY: number; MTD: number } } = {};
  const todayRecords = records.filter(record => record.transactionDate === DateTime.now().toFormat('dd.MM.yyyy'));
  const monthlyTotalTrans = (await db.execute({
    sql: `SELECT * FROM transactions
        WHERE transaction_date BETWEEN ? AND ?
        `,
    args: [ DateTime.now().startOf('month').toFormat('dd.MM.yyyy'), DateTime.now().toFormat('dd.MM.yyyy') ],
  }));
  const mtdResults = (await db.execute({
    sql: `
        SELECT company_name,SUM(bill_qty) as mtd FROM transactions
        WHERE transaction_date BETWEEN ? AND ?
        AND material_name LIKE '%BENZENE%'
        GROUP BY company_name
        `,
    args: [ DateTime.now().startOf('month').toFormat('dd.MM.yyyy'), DateTime.now().toFormat('dd.MM.yyyy') ],
  }));

  for (const record of mtdResults.rows) {
    let mtd = Number(record.mtd);
    if (DateTime.now().month === 1 && DateTime.now().year === 2025) {
      if (record.company_name === 'KUTCH') {
        mtd += 1625.159;
      }
      if (record.company_name === 'CHEMIE') {
        mtd += 471.394;
      }
    }
    if (mtd > 0) {
      aggregatedData[ record.company_name.toString() ] = { DAILY: 0, MTD: mtd };
    }
  }


  for (const record of todayRecords) {
    const { companyName: name, billQty: qty, billAmt: amount } = record;
    const key = name || 'Unknown';

    if (!aggregatedData[ key ]) {
      aggregatedData[ key ] = { DAILY: 0, MTD: mtdResults.rows.find((result) => result.company_name === key)?.mtd as number || 0 };
    }


    aggregatedData[ key ].DAILY += qty;
  }
  aggregatedData[ 'Total' ] = { DAILY: 0, MTD: 0 };
  for (const key in aggregatedData) {

    if (key === 'Total') continue;
    aggregatedData[ 'Total' ].DAILY += aggregatedData[ key ].DAILY;
    aggregatedData[ 'Total' ].MTD += aggregatedData[ key ].MTD;
  }
  return {
    aggregated: Object.entries(aggregatedData).map(([ name, data ]) => ({
      Name: name,
      DAILY: data.DAILY,
      MTD: data.MTD,
    })),
    all: monthlyTotalTrans.rows.map((e) => ({
      billAmt: Number(e.bill_amt || 0),
      billQty: Number(e.bill_qty || 0),
      cca: e.cca?.toString(),
      comp: Number(e.comp || 0),
      dbCr: e.db_cr?.toString(),
      docNo: Number(e.doc_no || 0),
      docType: e.doc_type?.toString(),
      material: Number(e.material || 0),
      materialName: e.material_name?.toString(),
      orderNo: Number(e.order_no || 0),
      plant: Number(e.plant || 0),
      shipToParty: Number(e.ship_to_party || 0),
      soldToParty: Number(e.sold_to_party || 0),
      transactionDate: e.transaction_date?.toString(),
      transactionTime: e.transaction_time?.toString(),
      ttNo: e.tt_no?.toString(),
      unit: e.unit?.toString(),
      companyName: e.company_name?.toString()
    }))
  };
}

