import puppeteer from 'puppeteer';
import db from './db.js'; 
import browsers from './browsers.js'; 

function getRandomBrowser() {
    return browsers[Math.floor(Math.random() * browsers.length)];
}

async function scrapePfizer() {
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

        console.log('Scraping data:', vaccines); 

        await db.query('TRUNCATE TABLE vaccines');
        const insertPromises = vaccines.map(vaccine => {
            return db.query('INSERT INTO vaccines (name, link) VALUES (?, ?)', [vaccine.name, vaccine.link]);
        });
        await Promise.all(insertPromises);
        console.log('Data scraped and stored successfully.');
    } catch (error) {
        console.error('Error in scrapePfizer:', error);
    }
}

export default scrapePfizer;
