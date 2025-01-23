import { Browser, chromium } from 'playwright';

interface SalesData {
    companyName: string;
    qty: number;
}

export async function generateSalesCharts(dailyData: SalesData[], mtdData: SalesData[]): Promise<Buffer> {
    let browser: Browser | null = null;
    try {
        browser = await chromium.launch();
        const page = await browser.newPage();

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>
                <style>
                    body { margin: 0; background: white; }
                    .container { 
                        width: 1000px; 
                        height: 1000px; 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center;
                    }
                    .chart-wrapper {
                        width: 100%;
                        height: 450px;
                        margin: 20px 0;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .chart-container { 
                        width: 100%;
                        height: 100%;
                        position: relative;
                    }
                    .total-text { 
                        text-align: center;
                        margin: 15px 0;
                        font-family: Arial;
                        font-size: 20px;
                        font-weight: 500;
                        width: 100%;
                    }
                    .mtd-total {
                        text-align: center;
                        font-family: Arial;
                        font-size: 24px;
                        font-weight: bold;
                        margin: 20px 0;
                        width: 100%;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="mtd-total" id="grandTotal"></div>
                    <div class="chart-wrapper">
                        <div class="chart-container">
                            <canvas id="dailyChart"></canvas>
                        </div>
                        <div class="total-text" id="dailyTotal"></div>
                    </div>
                    <div class="chart-wrapper">
                        <div class="chart-container">
                            <canvas id="mtdChart"></canvas>
                        </div>
                        <div class="total-text" id="mtdTotal"></div>
                    </div>
                </div>
                <script>
                    Chart.register(ChartDataLabels);
                    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                                  '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF9F40'];
                    
                    const dailyData = ${JSON.stringify(dailyData)};
                    const mtdData = ${JSON.stringify(mtdData)};

                    function createChart(ctx, data, title) {
                        return new Chart(ctx, {
                            type: 'pie',
                            data: {
                                labels: data.map(d => d.companyName),
                                datasets: [{
                                    data: data.map(d => d.qty),
                                    backgroundColor: colors.slice(0, data.length),
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                layout: {
                                    padding: {
                                        left: 50,
                                        right: 50,
                                        top: 20,
                                        bottom: 20
                                    }
                                },
                                animation: {
                                    duration: 0
                                },
                                plugins: {
                                    title: {
                                        display: true,
                                        text: title,
                                        font: { 
                                            size: 24,
                                            weight: 'bold'
                                        },
                                        padding: {
                                            top: 10,
                                            bottom: 20
                                        }
                                    },
                                    legend: {
                                        position: 'right',
                                        align: 'center',
                                        labels: {
                                            font: {
                                                size: 16
                                            },
                                            padding: 20
                                        }
                                    },
                                    datalabels: {
                                        formatter: (value, ctx) => {
                                            const dataset = ctx.dataset;
                                            const total = dataset.data.reduce((acc, curr) => acc + curr, 0);
                                            const percentage = ((value * 100) / total).toFixed(1);
                                            return \`\${value.toLocaleString()}\n(\${percentage}%)\`;
                                        },
                                        color: '#fff',
                                        font: {
                                            weight: 'bold',
                                            size: 16
                                        },
                                        anchor: 'center',
                                        align: 'center'
                                    }
                                },
                                radius: '90%', // Makes the pie chart larger
                                rotation: -90, // Rotates the chart to start from the top
                            }
                        });
                    }

                    // Create daily sales chart
                    const dailyChart = createChart(
                        document.getElementById('dailyChart'),
                        dailyData,
                        'Daily Sales Quantity by Company'
                    );

                    // Create MTD sales chart
                    const mtdChart = createChart(
                        document.getElementById('mtdChart'),
                        mtdData,
                        'Month-to-Date Sales Quantity by Company'
                    );

                    // Add totals
                    const dailyTotal = dailyData.reduce((sum, item) => sum + item.qty, 0);
                    const mtdTotal = mtdData.reduce((sum, item) => sum + item.qty, 0);
                    
                    document.getElementById('dailyTotal').textContent = 
                        'Total Daily Sales: ' + dailyTotal.toLocaleString() + ' units';
                    document.getElementById('mtdTotal').textContent = 
                        'Total MTD Sales: ' + mtdTotal.toLocaleString() + ' units';
                </script>
            </body>
            </html>
        `;

        await page.setContent(html);
        await page.setViewportSize({ width: 1000, height: 1000 });

        // Wait for charts to render
        await page.waitForFunction(() => {
            const canvases = document.getElementsByTagName('canvas');
            return canvases.length === 2 && 
                   canvases[0].toDataURL() !== 'data:,' && 
                   canvases[1].toDataURL() !== 'data:,';
        });

        // Capture the screenshot
        const screenshot = await page.screenshot({
            type: 'png',
            clip: { x: 0, y: 0, width: 1000, height: 1000 }
        });

        return screenshot;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}