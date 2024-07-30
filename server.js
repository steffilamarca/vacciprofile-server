import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import browsers from './browsers.js';

const app = express();
const port = 5000;

function getRandomBrowser() {
    return browsers[Math.floor(Math.random() * browsers.length)];
}

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/api/vaccines', async (req, res) => {
    try {
        const browserConfig = getRandomBrowser();
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setUserAgent(browserConfig.userAgent);
        await page.goto('https://www.pfizer.com/products/product-list', { waitUntil: 'networkidle2' });

        const vaccines = await page.evaluate(() => {
            const vaccineElements = Array.from(document.querySelectorAll('li.product-list__results-item'));
            const results = [];

            vaccineElements.forEach(el => {
                const aTag = el.querySelector('a');
                const divTag = el.querySelector('div');
            
                if (aTag && (divTag && divTag.innerHTML.toLowerCase().includes('vaccine') || (aTag.title && aTag.title.toLowerCase().includes('vaccine')))) {
                    results.push({
                        vaccineName: aTag.title ? aTag.title.trim() : aTag.innerHTML.trim(),
                        link: aTag.href,
                    });
                }
            });

            return results;
        });

        await browser.close();
        res.json(vaccines);
    } catch (error) {
        console.error('Error fetching vaccines:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
