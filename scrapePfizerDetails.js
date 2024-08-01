import puppeteer from 'puppeteer';
import db from './dbPool.js'; 
import browsers from './browsers.js'; 

function getRandomBrowser() {
    return browsers[Math.floor(Math.random() * browsers.length)];
}

async function scrapePfizerDetails() {
    const connection = await db.getConnection();

    try {
        const browserConfig = getRandomBrowser();
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        console.log('Navigating to page...');
        await page.setUserAgent(browserConfig.userAgent);

        const [rows] = await connection.query('SELECT detailsLink FROM manufacturers WHERE name = ?', ['Pfizer']);
        if (rows.length === 0) {
            throw new Error('Manufacturer not found.');
        }
        const detailsLink = rows[0].detailsLink;

        await page.goto(detailsLink, { waitUntil: 'networkidle2' });

        console.log('Page content loaded.');

        const details = await page.evaluate(() => {
            const extractInfo = (label) => {
                const th = Array.from(document.querySelectorAll('table.infobox.vcard tbody tr th'))
                    .find(th => th.innerText.trim().toLowerCase() === label.toLowerCase());
                if (th) {
                    const td = th.nextElementSibling;
                    return td ? td.innerText.trim() : '';
                }
                return '';
            };

            return {
                founded: extractInfo('Founded'),
                headquarters: extractInfo('Headquarters'),
                ceo: extractInfo('Key people').slice(0, -6),
                revenue: extractInfo('Revenue').slice(0, -7),
                operatingIncome: extractInfo('Operating income').slice(0, -7),
                netIncome: extractInfo('Net income').slice(0, -7),
                totalAssets: extractInfo('Total assets').slice(0, -7),
                totalEquity: extractInfo('Total equity').slice(0, -7),
                numberOfEmployees: extractInfo('Number of employees').slice(3, -7)
            };
        });

        await connection.query(
            `UPDATE manufacturers
            SET
                yearFounded = ?,
                headquarters = ?,
                ceo = ?,
                revenue = ?,
                operatingIncome = ?,
                netIncome = ?,
                totalAssets = ?,
                totalEquity = ?,
                numberOfEmployees = ?
            WHERE name = ?`,
            [
                parseInt(details.founded.split(';')[0].trim()),
                details.headquarters,
                details.ceo,
                details.revenue,
                details.operatingIncome,
                details.netIncome,
                details.totalAssets,
                details.totalEquity,
                details.numberOfEmployees,
                'Pfizer' 
            ]
        );

        await browser.close();
        console.log('Data scraped and updated in scrapePfizerDetails successfully.');
    } catch (error) {
        console.error('Error in scrapePfizerDetails:', error);
    } finally {
        connection.release();
    }
}

export default scrapePfizerDetails;