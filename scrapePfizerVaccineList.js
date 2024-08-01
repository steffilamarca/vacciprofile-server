import puppeteer from 'puppeteer';
import db from './dbPool.js'; 
import browsers from './browsers.js'; 

function getRandomBrowser() {
    return browsers[Math.floor(Math.random() * browsers.length)];
}

async function getNextVaccineId(connection) {
    try {
        const [rows] = await connection.query('SELECT MAX(vaccineId) AS maxId FROM vaccines');
        const maxId = rows[0].maxId || 'VX0000000'; 
        const nextIdNumber = parseInt(maxId.slice(2)) + 1;
        const nextId = `VX${String(nextIdNumber).padStart(7, '0')}`;
        return nextId;
    } catch (error) {
        console.error('Error getting next vaccineId:', error);
        throw error;
    }
}

async function insertVaccine(connection, vaccine) {
    const vaccineId = await getNextVaccineId(connection);
    try {
        await connection.query('INSERT INTO vaccines (vaccineId, name, link) VALUES (?, ?, ?)', [vaccineId, vaccine.name, vaccine.link]);
        console.log(`Inserted vaccine with name ${vaccine.name}`);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.error(`Duplicate entry for vaccine name ${vaccine.name}: ${error.message}`);
        } else {
            console.error('Error inserting vaccine:', error);
        }
    }
}

async function scrapePfizerVaccineList() {
    const connection = await db.getConnection();

    try {
        const browserConfig = getRandomBrowser();
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        console.log('Navigating to page...');
        await page.setUserAgent(browserConfig.userAgent);
        await page.goto('https://www.pfizer.com/products/product-list', { waitUntil: 'networkidle2' });

        console.log('Page content loaded.');

        const vaccines = await page.evaluate(() => {
            const vaccineElements = Array.from(document.querySelectorAll('li.product-list__results-item'));
            console.log('Found vaccine elements:', vaccineElements.length); 

            const results = [];

            for (const el of vaccineElements) {
                const aTag = el.querySelector('a');
                const divTag = el.querySelector('div');
                
                if (aTag && (divTag && divTag.innerHTML.toLowerCase().includes('vaccine') || (aTag.title && aTag.title.toLowerCase().includes('vaccine')))) {
                    const link = aTag.href;
                    results.push({
                        name: aTag.title ? aTag.title.trim() : aTag.innerHTML.trim(),
                        link,
                    });
                }
            }

            console.log('Results:', results); 
            return results;
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

export default scrapePfizerVaccineList;
