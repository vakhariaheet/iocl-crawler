interface GenerateEmailTemplateData {
  month: string;
  rows: { Name: string; DAILY: number; MTD: number }[];
  additionalText?: string;
}
/**
 * Generates an HTML email template for Benzene aggregated table
 * @param {Object} data - The data object containing table information
 * @param {string} data.month - The month and year for the report
 * @param {Object[]} data.rows - Array of row objects with name, daily, and mtd values
 * @param {string} [data.additionalText] - Optional additional text for the email body
 * @returns {string} HTML string of the email template
 */
export function generateBenzeneEmailTemplate(data: GenerateEmailTemplateData) {
  data.rows = data.rows.filter((row) => row.DAILY > 0 || row.MTD > 0);
  // Default month if not provided
  const month = data.month || 'November 2024';

  // Default additional text if not provided
  const additionalText =
    data.additionalText ||
    'This is the aggregated data for Benzene production. ' +
      'The table shows the daily and month-to-date (MTD) figures for the specified location.';

  // Generate table rows dynamically
  const tableRows = data.rows
    .map(
      (row) => `
      <tr>
          <td>${row.Name}</td>
          <td>${row.DAILY.toFixed(3)}</td>
          <td>${row.MTD.toFixed(3)}</td>
      </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benzene Aggregated Table</title>
  <style>
      body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
      }
      .table-container {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
      }
      .table-container th, 
      .table-container td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
      }
      .table-container th {
          background-color: #f2f2f2;
          font-weight: bold;
      }
      .header {
          background-color: #f8f8f8;
          padding: 10px;
          text-align: center;
          font-weight: bold;
          margin-bottom: 20px;
      }
  </style>
</head>
<body>
  <div class="header">
      ${month} Benzene
  </div>

  <table class="table-container">
      <thead>
          <tr>
              <th>Name</th>
              <th>DAILY</th>
              <th>MTD</th>
          </tr>
      </thead>
      <tbody>
          ${tableRows}
      </tbody>
  </table>

  <p>
      ${additionalText}
  </p>
</body>
</html>
  `;
}
