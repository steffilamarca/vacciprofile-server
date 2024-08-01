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
        await page.goto('', { waitUntil: 'networkidle2' });

        console.log('Page content loaded.');

        const details = await page.evaluate(() => {
           
        });

        await browser.close();

        await connection.query('START TRANSACTION');
        await connection.query('TRUNCATE TABLE vaccines');

        for (const vaccine of vaccines) {
            await insertVaccine(connection, vaccine);
        }

        await connection.query('COMMIT');
        console.log('Data scraped and stored successfully.');
    } catch (error) {
        console.error('Error in scrapePfizerVaccineList:', error);
        await connection.query('ROLLBACK');
    } finally {
        connection.release();
    }
}

export default scrapePfizerDetails;
